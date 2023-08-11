var fs = require('fs-extra')
var utils = new (require('../utils.js'))()


module.exports = class WebServer extends WS_Root  {
    constructor(opt){
        super(opt)
        
        this.fileIdx = -1

        this.routes = {}

        this.socket = require('socket.io')({
            maxHttpBufferSize: 100000000,
            pingInterval: 60000,
            pingTimeout: 60000,
            upgradeTimeout: 30000
        })
        
        this.socket.on('connection', client => {
            if (this.endpoint) return client.emit('error', {error: 'busy_with_client'})

            console.log('Client connected from ' + client.conn.remoteAddress)

            this.endpoint = client

            
            this.__ws_fileUpload = new (require('./ws_file_upload.js'))({endpoint: this.endpoint, receiver: true, parent: this})

            for (var route in this.routes) this.captureRoute(this.routes[route])

            this.endpoint.on('disconnect', reason => {
                this.endpoint = undefined

                console.log('Client at '+ client.conn.remoteAddress + ' disconnected!')

                if (opt.onDisconnect) opt.onDisconnect({reason: reason, client: client})
            })
            
            if (this.onClientConnected) this.onClientConnected(client)
        })
    }

    listen(opt = {port: 5487}){
        try {
            this.socket.listen(opt.port)
            if (this.opt.onListening) this.opt.onListening(true)
        } catch(err) {
            if (this.opt.onListening) this.opt.onListening(false)
        }
    }
}