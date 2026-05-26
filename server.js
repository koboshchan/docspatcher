const http = require('node:http')
const express = require('express')
const { WebSocketServer } = require('ws')
const { z } = require('zod')
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js')
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js')
const { WebSocketBridge } = require('./websocket-bridge')

const PORT = Number(process.env.PORT || 3000)
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'dev-token'

const app = express()
app.use(express.json())

const bridge = new WebSocketBridge()

const mcpServer = new McpServer({
  name: 'google-docs-bridge',
  version: '1.0.0',
})

mcpServer.tool(
  'getfiles',
  'List recent Google Docs files. Optional `limit` (1-100, default 10).',
  { limit: z.number().int().min(1).max(100).default(10) },
  async ({ limit }) => {
    const result = await bridge.call('getfiles', { limit })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }
)

mcpServer.tool(
  'searchfiles',
  'Search Google Docs by text query. Args: `query` (required), `limit` (1-100, default 10).',
  {
    query: z.string().min(1),
    limit: z.number().int().min(1).max(100).default(10),
  },
  async ({ query, limit }) => {
    const result = await bridge.call('searchfiles', { query, limit })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }
)

mcpServer.tool(
  'renamedoc',
  'Rename a Google Doc file. Args: `id` (doc file id), `title` (new document title).',
  {
    id: z.string().min(1),
    title: z.string().min(1),
  },
  async ({ id, title }) => {
    const result = await bridge.call('renamedoc', { id, title })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    }
  }
)

mcpServer.tool(
  'renametab',
  'Rename a tab in a Google Doc. Args: `id` (doc id), `tabId` (target tab id), `title` (new tab title).',
  {
    id: z.string().min(1),
    tabId: z.string().min(1),
    title: z.string().min(1),
  },
  async ({ id, tabId, title }) => {
    const result = await bridge.call('renametab', { id, tabId, title })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    }
  }
)

mcpServer.tool(
  'newdoc',
  'Create a new Google Doc. Args: `title` (new document title).',
  {
    title: z.string().min(1),
  },
  async ({ title }) => {
    const result = await bridge.call('newdoc', { title })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    }
  }
)

mcpServer.tool(
  'newtab',
  'Create a new tab in a Google Doc. Args: `id` (doc id), `title` (tab title), optional `parentTabId` for nesting.',
  {
    id: z.string().min(1),
    title: z.string().min(1),
    parentTabId: z.string().min(1).optional(),
  },
  async ({ id, title, parentTabId }) => {
    const result = await bridge.call('newtab', { id, title, parentTabId })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    }
  }
)

mcpServer.tool(
  'getcontents',
  'Read document content by file `id` in the custom markdown format only. Supports chunked reads with optional 1-based `startLine` and `endLine`, and optional `tabId` (defaults to document body). Returns document metadata including `title`, `lastEditedMs`, `lastEditedIso`, and `availableTabs` (tab id/title/index list). Headings are supported from `#` to `####`. Inline styles may include `**bold**`, `*italic*`, `{u}...{/u}`, `{color:#rrggbb}...{/color}`, and `{size:N}...{/size}` (font size in points). List nesting is exported with leading tabs; unordered list items use `* ` and ordered list items use `N. `.',
  {
    id: z.string().min(1),
    startLine: z.number().int().min(1).optional(),
    endLine: z.number().int().min(1).optional(),
    tabId: z.string().min(1).optional(),
    format: z.literal('markdown').optional().default('markdown'),
  },
  async ({ id, startLine, endLine, tabId, format }) => {
    const result = await bridge.call('getcontents', { id, startLine, endLine, tabId, format })
    const structuredContent =
      result && typeof result === 'object' && !Array.isArray(result)
        ? result
        : { text: typeof result === 'string' ? result : '' }
    const text = typeof structuredContent.text === 'string' ? structuredContent.text : ''
    return {
      content: [{ type: 'text', text }],
      structuredContent,
    }
  }
)

mcpServer.tool(
  'applypatch',
  'Apply a patch to a Google Doc using the custom markdown format only. Args: `id`, `patch`, optional `algorithm` (`unified` default or `dmp`), optional `tabId` (defaults to document body). Unified syntax uses hunks like `@@ -oldStart,oldCount +newStart,newCount @@` with context lines prefixed by space, removals with `-`, and additions with `+`. Headings are supported from `#` to `####`. Supported inline style tags are `**bold**`, `*italic*`, `{u}...{/u}`, `{color:#rrggbb}...{/color}`, and `{size:N}...{/size}` (font size in points). For lists, use leading tabs for nesting, `* ` or `- ` for unordered items, and `N. ` for ordered items.',
  {
    id: z.string().min(1),
    patch: z.string().min(1),
    algorithm: z.enum(['unified', 'dmp']).default('unified'),
    tabId: z.string().min(1).optional(),
    format: z.literal('markdown').optional().default('markdown'),
  },
  async ({ id, patch, algorithm, tabId, format }) => {
    const result = await bridge.call('applypatch', { id, patch, algorithm, tabId, format })
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }
)

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    bridgeConnected: !!bridge.bridgeSocket,
    port: PORT,
  })
})

app.post('/mcp', async (req, res) => {
  req.headers.accept = 'application/json, text/event-stream'
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  res.on('close', () => {
    transport.close()
  })

  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })
bridge.attach(wss, BRIDGE_TOKEN)

server.listen(PORT, () => {
  console.log(`MCP + WebSocket server listening on :${PORT}`)
  console.log(`WebSocket bridge path: ws://localhost:${PORT}/ws`)
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`)
})
