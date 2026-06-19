import http from 'node:http';
import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getWebAppUrl, setWebAppUrl } from './config-store.js';
import { setToken, isTokenValid, getOrRefreshToken } from './token-manager.js';
import * as googleApi from './google-api-client.js';
import {
  listAvailableTabs,
  resolveDocTabContext,
  getLinearTextAndMap,
  normalizeContentFormat,
  parseUnifiedHunks,
  applyUnifiedHunksToText,
  applyPatchToText,
  getLinearOperations,
  translateOpsToDocOps,
  getLinearOpsFromOt
} from './patch-engine.js';

const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(express.json());

// CORS configuration for token sync
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const mcpServer = new McpServer({
  name: 'google-docs-native-mcp',
  version: '2.0.0',
});

// GET / config UI
app.get('/', (req, res) => {
  const webAppUrl = getWebAppUrl() || '';
  const tokenValid = isTokenValid();

  const badgeClass = webAppUrl ? (tokenValid ? 'status-active' : 'status-pending') : 'status-inactive';
  const badgeText = webAppUrl ? (tokenValid ? 'Connected & Active' : 'Auth Required') : 'Setup Pending';

  res.send(`
<!doctype html>
<html>
  <head>
    <title>Docs Patcher Config</title>
  </head>
  <body>
    <h1>Docs Patcher Config</h1>
    
    <p>Status: <strong>${badgeText}</strong></p>

    <form action="/config" method="POST">
      <label for="webAppUrl">Apps Script Web App URL:</label><br>
      <input type="text" id="webAppUrl" name="webAppUrl" placeholder="https://script.google.com/macros/s/.../exec" value="${webAppUrl}" style="width: 500px;" required>
      <button type="submit">Save URL</button>
    </form>

    ${webAppUrl ? `
      <br>
      <button onclick="window.open('${webAppUrl}')">Authenticate / Sync Token Now</button>
    ` : ''}

    <h2>Setup Instructions</h2>
    <ol>
      <li>Create a Google Apps Script project at <a href="https://script.google.com/" target="_blank">script.google.com</a>.</li>
      <li>Paste the content of your local <code>patch.gs</code> file into the script editor.</li>
      <li>Replace the project's <code>appsscript.json</code> manifest with the local <code>appsscript.json</code>.</li>
      <li>Click <strong>Deploy > New deployment</strong>.</li>
      <li>Select type <strong>Web app</strong>, configure Web App settings:
        <ul>
          <li>Execute as: <strong>Me</strong></li>
          <li>Who has access: <strong>Only myself</strong></li>
        </ul>
      </li>
      <li>Deploy, copy the Web App URL, and paste it in the form above.</li>
    </ol>
  </body>
</html>
  `);
});

// POST /config - save Web App URL
app.post('/config', express.urlencoded({ extended: true }), (req, res) => {
  const { webAppUrl } = req.body;
  if (webAppUrl) {
    setWebAppUrl(webAppUrl.trim());
  }
  res.redirect('/');
});

// POST /set-token - sync token
app.post('/set-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'token is required' });
  }
  setToken(token);
  console.log('Google API Token synced successfully.');
  res.json({ ok: true });
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    webAppConfigured: !!getWebAppUrl(),
    tokenValid: isTokenValid(),
    port: PORT,
  });
});

// POST /mcp
app.post('/mcp', async (req, res) => {
  req.headers.accept = 'application/json, text/event-stream';
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on('close', () => {
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// --- Register MCP Tools ---

mcpServer.tool(
  'getfiles',
  'List recent Google Docs files. Optional `limit` (1-100, default 10).',
  { limit: z.number().int().min(1).max(100).default(10) },
  async ({ limit }) => {
    const result = await googleApi.getFiles(limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

mcpServer.tool(
  'searchfiles',
  'Search Google Docs by text query. Args: `query` (required), `limit` (1-100, default 10).',
  {
    query: z.string().min(1),
    limit: z.number().int().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const result = await googleApi.searchFiles(query, limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

mcpServer.tool(
  'renamedoc',
  'Rename a Google Doc file. Args: `id` (doc file id), `title` (new document title).',
  {
    id: z.string().min(1),
    title: z.string().min(1),
  },
  async ({ id, title }) => {
    const result = await googleApi.renameDoc(id, title);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'renametab',
  'Rename a tab in a Google Doc. Args: `id` (doc id), `tabId` (target tab id), `title` (new tab title).',
  {
    id: z.string().min(1),
    tabId: z.string().min(1),
    title: z.string().min(1),
  },
  async ({ id, tabId, title }) => {
    const result = await googleApi.docsApiBatchUpdate(id, [
      {
        updateTabProperties: {
          tabId: tabId,
          tabProperties: { title: title },
          fields: 'title',
        },
      },
    ]);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'newdoc',
  'Create a new Google Doc. Args: `title` (new document title).',
  {
    title: z.string().min(1),
  },
  async ({ title }) => {
    const result = await googleApi.newDoc(title);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'newtab',
  'Create a new tab in a Google Doc. Args: `id` (doc id), `title` (tab title), optional `parentTabId` for nesting.',
  {
    id: z.string().min(1),
    title: z.string().min(1),
    parentTabId: z.string().min(1).optional(),
  },
  async ({ id, title, parentTabId }) => {
    const tabProperties: any = { title: title };
    if (parentTabId) tabProperties.parentTabId = parentTabId;
    
    await googleApi.docsApiBatchUpdate(id, [
      {
        addDocumentTab: {
          tabProperties,
        },
      },
    ]);
    
    const doc = await googleApi.docsApiGetDocument(id, true);
    const tabs = listAvailableTabs(doc);
    const created = tabs.filter((t: any) => t.title === title);
    const tab = created.length > 0 ? created[created.length - 1] : null;
    
    const result = {
      id,
      tabId: tab ? tab.id : null,
      title: tab ? tab.title : title,
      availableTabs: tabs,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'makecopy',
  'Make a copy of an existing Google Doc. Args: `id` (source document ID), optional `title` (title of the copied document).',
  {
    id: z.string().min(1),
    title: z.string().min(1).optional(),
  },
  async ({ id, title }) => {
    const result = await googleApi.makeCopy(id, title);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'getcontents',
  'Read document content by file `id` in a tokenized linear text format. Supports chunked reads with optional 1-based `startLine` and `endLine`, and optional `tabId` (defaults to document body). Returns document metadata including `title`, `lastEditedMs`, `lastEditedIso`, and `availableTabs` (tab id/title/index list).',
  {
    id: z.string().min(1),
    startLine: z.number().int().min(1).optional(),
    endLine: z.number().int().min(1).optional(),
    tabId: z.string().min(1).optional(),
    format: z.literal('markdown').optional().default('markdown'),
  },
  async ({ id, startLine, endLine, tabId, format }) => {
    const normalizedFormat = normalizeContentFormat(format);
    const doc = await googleApi.docsApiGetDocument(id, true);
    const availableTabsList = listAvailableTabs(doc);
    
    const driveData = await googleApi.getFileMetadata(id);
    const updated = new Date(driveData.modifiedTime || Date.now());
    
    const tabContext = resolveDocTabContext(doc, tabId);
    const linearData = getLinearTextAndMap(doc, tabContext);
    const text = linearData.text;
    const lines = text.split('\n');
    const totalLines = lines.length;

    const start = Math.max(1, startLine || 1);
    const end = Math.min(totalLines, endLine || totalLines);

    const result = {
      id,
      title: driveData.name || doc.title || 'Untitled',
      lastEditedMs: updated.getTime(),
      lastEditedIso: driveData.modifiedTime || updated.toISOString(),
      availableTabs: availableTabsList,
      startLine: start,
      endLine: end,
      totalLines,
      hasMore: end < totalLines,
      text: lines.slice(start - 1, end).join('\n'),
      elementMap: linearData.elementMap,
    };
    return {
      content: [{ type: 'text', text: result.text }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'applypatch',
  'Apply a patch to a Google Doc using the tokenized linear text format. Args: `id`, `patch`, optional `algorithm` (`unified` default or `dmp`), optional `tabId` (defaults to document body).',
  {
    id: z.string().min(1),
    patch: z.string().min(1),
    algorithm: z.enum(['unified', 'dmp']).default('unified'),
    tabId: z.string().min(1).optional(),
    format: z.literal('markdown').optional().default('markdown'),
  },
  async ({ id, patch, algorithm, tabId, format }) => {
    const normalizedFormat = normalizeContentFormat(format);
    const doc = await googleApi.docsApiGetDocument(id, true);
    const tabContext = resolveDocTabContext(doc, tabId);
    const linearData = getLinearTextAndMap(doc, tabContext);
    const originalText = linearData.text;
    const elementMap = linearData.elementMap;

    let text2 = '';
    if (algorithm === 'unified') {
      const hunks = parseUnifiedHunks(patch);
      const unifiedResult = applyUnifiedHunksToText(originalText, hunks);
      text2 = unifiedResult[0];
    } else {
      const dmpResult = applyPatchToText(originalText, patch);
      text2 = dmpResult[0];
    }

    const linearOps = getLinearOperations(originalText, text2);
    const docOps = translateOpsToDocOps(linearOps, elementMap, tabContext.tabId, tabContext.inlineObjects);
    const appliedOperationsCount = await googleApi.applyDocOpsToDocument(id, tabContext, docOps);

    const result = {
      algorithm,
      format: normalizedFormat,
      tabId: tabContext.tabId || null,
      tabName: tabContext.tabName || null,
      success: true,
      appliedOperationsCount,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

mcpServer.tool(
  'apply_structural_edits',
  'Apply safe, non-destructive text changes to a document tab using direct index tracking components.',
  {
    id: z.string().min(1),
    tabId: z.string().min(1),
    operations: z.array(
      z.object({
        type: z.enum(['retain', 'insert', 'delete']),
        text: z.string().optional(),
        count: z.number().int().positive().optional(),
      })
    ),
  },
  async ({ id, tabId, operations }) => {
    const doc = await googleApi.docsApiGetDocument(id, true);
    const tabContext = resolveDocTabContext(doc, tabId);
    const linearData = getLinearTextAndMap(doc, tabContext);
    const elementMap = linearData.elementMap;

    const linearOps = getLinearOpsFromOt(operations);
    const docOps = translateOpsToDocOps(linearOps, elementMap, tabContext.tabId, tabContext.inlineObjects);
    const appliedOperationsCount = await googleApi.applyDocOpsToDocument(id, tabContext, docOps);

    const result = {
      success: true,
      appliedOperationsCount,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  }
);

// Start HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Native MCP + Express server listening on :${PORT}`);
  console.log(`Config page: http://localhost:${PORT}/`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
