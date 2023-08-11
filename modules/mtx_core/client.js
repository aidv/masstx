const MTX_Core = require('./core.js')
var fs = require('fs-extra')

module.exports = class Client extends MTX_Core {
    constructor(opt){
        super(opt)
        
        if (!mtx.args.inputPath) process.exit(null, 'Must define input path')
        if (mtx.args.outputPath) fs.ensureDirSync(mtx.args.outputPath)


        mtx.endpoint = new (require(`../ws/client.js`))({isClient: true})

        this.init()
    }

    async init(){
        this.connectTimeoutTimer = setTimeout(()=>{
            console.error('Failed to connect due to timeout!')
            process.exit()
        }, 10000)

        console.log('Trying to connect to ' + mtx.args.target + ':' + mtx.args.port + '. Terminating in 10 seconds if connection is not established.')
        await mtx.endpoint.tryConnect(mtx.args.target + ':' + mtx.args.port)
        console.log('Connected!')
        clearTimeout(this.connectTimeoutTimer)

        console.log('Starting in 3 seconds...')
        await this.sleep(3000)
        console.log('Started!')

        this.__init()

        mtx.endpoint.onReceiveProgress = res =>{
            var filePath = mtx.args.outputPath + res.file.name
            mtx.stats.list[filePath] = `${res.progress.percent}%  ${res.progress.rate}MB/s (Top: ${res.progress.rateTop}MB/s)`
    
            if (res.progress.percent === 100) delete mtx.stats.list[filePath]
        }


        var ft = new (require('../file_transfer/file_transfer.js'))()
        var fs = require('fs')
        if (!mtx.args.outputPath){
            if (fs.existsSync(mtx.args.inputPath)){
                //send from local to remote
                if (!fs.existsSync(mtx.args.inputPath)) process.exit(null, 'Input path does not exist')
                
                await ft.upload({path: mtx.args.inputPath})

                process.exit((mtx.args.validate ? 'Validation' : 'Transmission') + ' completed!')
            } else {
                console.error('Cannot send local path "' + mtx.args.inputPath + '" to target, as it does not exist!')
                process.exit()
            }
        } else {
            if (!mtx.args.outputPath) process.exit(null, 'Output not defined')
            
            setInterval(()=>{
                mtx.stats.list['>'] = mtx.stats.transfer.completed + '/' + mtx.stats.transfer.count
                for (var key in mtx.stats.list){
                    var val = mtx.stats.list[key]
                    console.log(key + ': ' + val)
                }

                console.log('')
            }, 1000)

            mtx.endpoint.post('download', {inputPath: mtx.args.inputPath})
            .then(res => {
                process.exit((mtx.args.validate ? 'Validation' : 'Transmission') + ' completed!')
            })
            .catch(err => {
                if (err.error === 'invalid_remote_path'){
                    process.exit(null, 'Input path ' + mtx.args.inputPath + ' at remote target does not exist')
                }
                process.exit(null, err)
            })
        }
    }
}