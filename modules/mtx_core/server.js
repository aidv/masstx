var fs = require('fs-extra')

module.exports = class Server extends MTX_Core {
    constructor(opt){
        super(opt)
        
        //if (!mtx.args.outputPath) process.exit(null, 'Must define output path')
        //if (mtx.args.outputPath[mtx.args.outputPath.length - 1] !== '/') mtx.args.outputPath += '/'
        if (mtx.args.outputPath) fs.ensureDirSync(mtx.args.outputPath)

        mtx.endpoint = new (require(`../ws/server.js`))({
            onListening: success => {
                if (success){
                    console.log('Listening at port ' + mtx.args.port)
                    console.log('Awaiting client to connect...')
                    return
                }
                console.error('Port ' + mtx.args.port + ' already in use. Use -p <number> to set port.')
            }
        })

        mtx.endpoint.listen({port: mtx.args.port})

        this.cwd = __dirname + '/'

        this.__init()
    }

    async on_download(req, res){
        try {
            var ft = new (require('../file_transfer/file_transfer.js'))()
            if (!fs.existsSync(req.body.inputPath)) return res.send({error: 'invalid_remote_path'})

            await ft.upload({path: req.body.inputPath, outputPath: req.body.outputPath})

            res.ok()

            process.exit()
        } catch(err) {
            process.exit(null, err)
        }
    }
}