# Docs Patcher MCP Bridge

This project connects Google Apps Script to a local MCP server over WebSocket so agents can read and patch Google Docs.

## What it provides

- MCP tools: `getfiles`, `searchfiles`, `getcontents`, `applypatch`
- WebSocket bridge between Apps Script web app and Node server
- Patch algorithms: `unified` (default) and `dmp`

## Quick start

1. Install dependencies:

   npm install

2. Start the server:

   PORT=3000 BRIDGE_TOKEN=dev-token npm start

3. Deploy `patch.gs` as a Google Apps Script Web App. 

   1. In https://script.google.com/home/projects/create
   2. Copy-paste the contents of `patch.gs` into the script editor.
   3. Add Drive v3 and Docs v1 APIs in "Services".
   4. Deploy as Web App: Deploy > New deployment > Select type "Web app" > Set "Who has access" to "Only Myself" > Set "Execute as" to "Me" > Deploy and note the URL.

4. Open the web app URL with bridge params:

   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?wsUrl=ws://localhost:3000/ws&token=dev-token

## Endpoints

- MCP HTTP: `http://localhost:3000/mcp`
- Health: `http://localhost:3000/health`
- WebSocket bridge: `ws://localhost:3000/ws`

## Notes

- `getcontents` supports chunked reads with `startLine` and `endLine`.
- `applypatch` returns metadata only (no full document text).
