const { randomUUID } = require('node:crypto')

class WebSocketBridge {
  constructor() {
    this.bridgeSocket = null
    this.pending = new Map()
  }

  attach(wss, expectedToken = null) {
    wss.on('connection', (socket) => {
      socket.on('message', (raw) => {
        let msg
        try {
          msg = JSON.parse(String(raw))
        } catch (_) {
          return
        }

        if (msg.type === 'hello' && msg.role === 'apps-script-bridge') {
          if (expectedToken && msg.token !== expectedToken) {
            socket.close(4001, 'invalid token')
            return
          }
          this.bridgeSocket = socket
          return
        }

        if (msg.type === 'rpc_result' && msg.id && this.pending.has(msg.id)) {
          const p = this.pending.get(msg.id)
          this.pending.delete(msg.id)
          if (msg.error) {
            p.reject(new Error(msg.error))
          } else {
            p.resolve(msg.result)
          }
        }
      })

      socket.on('close', () => {
        if (this.bridgeSocket === socket) {
          this.bridgeSocket = null
        }
      })
    })
  }

  async call(method, params = {}, timeoutMs = 30000) {
    if (!this.bridgeSocket || this.bridgeSocket.readyState !== 1) {
      throw new Error('Apps Script bridge is not connected over WebSocket')
    }

    const id = randomUUID()
    const payload = { type: 'rpc_request', id, method, params }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`RPC timeout for method ${method}`))
      }, timeoutMs)

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        },
      })

      this.bridgeSocket.send(JSON.stringify(payload), (err) => {
        if (err) {
          clearTimeout(timer)
          this.pending.delete(id)
          reject(err)
        }
      })
    })
  }
}

module.exports = { WebSocketBridge }
