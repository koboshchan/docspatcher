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
  'getcontents',
  'Read document text by file `id`. Supports chunked reads with optional 1-based `startLine` and `endLine`.',
  {
    id: z.string().min(1),
    startLine: z.number().int().min(1).optional(),
    endLine: z.number().int().min(1).optional(),
  },
  async ({ id, startLine, endLine }) => {
    const result = await bridge.call('getcontents', { id, startLine, endLine })
    const text = typeof result?.text === 'string' ? result.text : ''
    return {
      content: [{ type: 'text', text }],
      structuredContent: result,
    }
  }
)

mcpServer.tool(
  'applypatch',
  'Apply a patch to a Google Doc. Args: `id`, `patch`, optional `algorithm` (`unified` default or `dmp`). Unified syntax uses hunks like `@@ -oldStart,oldCount +newStart,newCount @@` with context lines prefixed by space, removals with `-`, and additions with `+`.',
  {
    id: z.string().min(1),
    patch: z.string().min(1),
    algorithm: z.enum(['unified', 'dmp']).default('unified'),
  },
  async ({ id, patch, algorithm }) => {
    const result = await bridge.call('applypatch', { id, patch, algorithm })
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
