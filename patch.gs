function doGet(e) {
  const token = ScriptApp.getOAuthToken();
  
  const html = `<!doctype html>
<html>
  <head>
    <title>Docs Patcher Auth</title>
    <style>
      body { font-family: sans-serif; margin: 20px; }
      .success { color: green; font-weight: bold; }
      .error { color: red; font-weight: bold; }
      .syncing { color: blue; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>Docs Patcher Token Sync</h1>
    <p id="msg">Syncing your active Google Account token with your local MCP server...</p>
    <p id="status" class="syncing">Syncing Token...</p>

    <div id="manual-area" style="display: none; margin-top: 15px;">
      <button onclick="syncToken()">Retry Syncing Token</button>
    </div>

    <script>
      const token = ${JSON.stringify(token)};
      
      function syncToken() {
        document.getElementById('status').className = 'syncing';
        document.getElementById('status').innerText = 'Syncing Token...';
        document.getElementById('msg').innerText = 'Syncing your active Google Account token with your local MCP server...';
        document.getElementById('manual-area').style.display = 'none';

        fetch('http://localhost:3000/set-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: token })
        })
        .then(res => {
          if (!res.ok) throw new Error('HTTP status ' + res.status);
          return res.json();
        })
        .then(data => {
          if (data.ok) {
            document.getElementById('status').className = 'success';
            document.getElementById('status').innerText = 'Synced Successfully';
            document.getElementById('msg').innerText = 'You can close this tab now and return to your terminal or editor.';
            // Auto close window if possible after 1.5s
            setTimeout(() => { window.close(); }, 1500);
          } else {
            showError('Server responded with error: ' + (data.error || 'unknown'));
          }
        })
        .catch(err => {
          showError('Could not connect to http://localhost:3000. Please check if your local MCP server is running.');
        });
      }

      function showError(errorText) {
        document.getElementById('status').className = 'error';
        document.getElementById('status').innerText = 'Connection Failed';
        document.getElementById('msg').innerText = errorText;
        document.getElementById('manual-area').style.display = 'block';
      }

      // Initial sync execution
      syncToken();
    </script>
  </body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Docs Patcher Auth')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Dummy function to force Apps Script to request authorization scopes for Google Docs & Google Drive.
function dummyScopeRegistration() {
  DriveApp.getRootFolder();
  DocumentApp.create("Dummy");
}
