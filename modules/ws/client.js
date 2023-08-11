var fs = require('fs')
const socket = require('socket.io-client')

module.exports = class WebClient extends WS_Root {
    constructor(opt){
        super({...opt, ...{isClient: true}})
        this.routes = {}
    }

    tryConnect(url){
        return new Promise((resolve, reject) => {
            if (this.__connected) return resolve(true)
            var cleanURL = 'ws://' + url.replace('http://', '').replace('https://', '').replace('ws://', '').split('/')[0]
            this.endpoint = socket.connect(cleanURL, {
                maxHttpBufferSize: 100000000,
                pingInterval: 60000,
                pingTimeout: 60000,
                upgradeTimeout: 30000
            })
            
            
            this.endpoint.on('connect', function () {
                this.__connected = true
                resolve(true)
            })

            this.endpoint.on('disconnect', reason => {
                console.error('[ERROR] Disconnected. Reason: ' + reason)
                this.__connected = false
            })

            this.endpoint.on('error', (_a, _b, _c, _d)=>{
                var x = 0
            })
            

            this.__ws_fileUpload = new (require('./ws_file_upload.js'))({endpoint: this.endpoint, parent: this, receiver: true})
            
            for (var route in this.routes) this.captureRoute(this.routes[route])
        })
    }
}