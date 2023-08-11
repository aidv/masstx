var fs = require('fs-extra')
const os = require("os")

module.exports = class WS_FileUpload {
    constructor(opt){
        this.parent = opt.parent

        var kb = 1000
        var mb = kb * 1000
        this.__chunkSize = mb * 50
        this.endpoint = opt.endpoint

        if (opt.receiver) this.configAsReceiver()
    }

    send(opt){
        return new Promise(async (resolve, reject)=>{
            mtx.fileUUID++

            var fnSplit = opt.filePath.split('\\').join('//').split('/')
            var filename = fnSplit[fnSplit.length - 1]

            var stats = fs.statSync(opt.filePath)

            var bufferPos = 0

            var timeMS = Date.now()
            var sentDuringCycle = 0

            var MBDuringOneSecond = 0
            var highestRate = 0



            var fileInfo = {
                __name: 'file',
                size: stats.size,
                name: filename,
                uuid: mtx.fileUUID + '_' + Date.now()
            }


            for (var i = 0; i < stats.size; i++){
                var chunk = await this.getChunk({path: opt.filePath, pos: bufferPos})
                i += chunk.length

                //console.log(`chunk: 0=${chunk[0]}    ${chunk.length}=${chunk[chunk.length - 1]}`)

                //console.log('Sent: ' + ((bufferPos+1) / 1000000) + ' MB')


                sentDuringCycle += chunk.length
                var msDiff = Date.now() - timeMS

                if (msDiff > 1000){
                    MBDuringOneSecond = parseFloat((((sentDuringCycle / msDiff) * 1000) / 1000000).toFixed(2))

                    sentDuringCycle = 0
                    timeMS = Date.now()

                    if (MBDuringOneSecond > highestRate ) highestRate = MBDuringOneSecond
                    //console.log(`[WS File Uploader: ${filename}] ${MBDuringOneSecond}MB/s (Top: ${highestRate}MB/s)`)
                }

                var progress = {
                    chunkSent: chunk.length,
                    totalSent: bufferPos + 1,
                    percent: parseFloat((((bufferPos + 1) / stats.size) * 100).toFixed(2)),
                    rate: MBDuringOneSecond,
                    rateTop: highestRate
                }

                if (opt.onProgress) opt.onProgress(progress)


                var data = {
                    route: opt.route,
                    metadata: opt.body,
                    progress: progress,
                    file: {
                        ...fileInfo,
                        ...{
                            chunkSize: this.__chunkSize,
                            data: chunk
                        }
                    }
                }

                var res = await this.sendChunk({
                    path: opt.filePath,
                    posRange: {start: bufferPos, chunkSize: chunk.length},
                    data: data
                })

                /*if (res === 'goToNext'){
                    return resolve({status: true, completed: true})
                }*/


                
                bufferPos += chunk.length
            }

            try {
                var finalData = {
                    data: {route: opt.route, metadata: opt.body, file: fileInfo},
                    finalize: true
                }

                if (mtx.args.validate){
                    finalData.data.file.path = opt.filePath.replace(mtx.args.inputPath, '')
                    finalData.data.file.validate = true
                }

                await this.sendChunk(finalData)
                resolve({status: true, completed: true})
            } catch(err) {
                reject(err)
            }
        })
    }

    getChunk(opt){
        return new Promise(async (resolve, reject)=>{
            var chunks = []
            var stream = fs.createReadStream(opt.path, {start: opt.pos, end: opt.pos + (opt.chunkSize || this.__chunkSize) - 1})
            stream.on('data', async data => {
                chunks.push(data)
            })
            .on('end', ()=>{
                resolve(Buffer.concat(chunks))
            })
            .on('error', err => {
               reject(err)
            })
        })
    }

    sendChunk(opt){
        return new Promise((resolve, reject)=>{
            if (opt.finalize){
                opt.data.file.finalize = true
            }

            if (mtx.args.validate){
                opt.data.file.validate = true

                if (!opt.finalize){
                    opt.data.file.path = opt.path.replace(mtx.args.inputPath, '')
                    opt.data.file.posRange = opt.posRange

                    var crc32 = require('fast-crc32c')
                    opt.data.file.checksum = crc32.calculate(opt.data.file.data)
                    delete opt.data.file.data
                }
            }

            try {
                this.endpoint.emit('__WS_FileUpload_fileChunk', opt.data, res => {
                    if (res.error) return reject(res)

                    if (res.invalid_file){
                        var x = 0
                    }

                    if (mtx.args.validate){
                        if (!opt.finalize && !res.valid){
                            if (opt.path === undefined){
                                var x = 0
                            }
                            
                            mtx.stats.failed++
                            console.error('Invalid and removed: ' + opt.path)
                            return resolve('goToNext')
                        }
                    }

                    resolve()
                })
            } catch(err) {
                var x = 0
            }
        })
    }

    /********************/

    configAsReceiver(){
        var count = 0
        this.endpoint.on('__WS_FileUpload_fileChunk', async (body, respondWith)=>{
            var parent = this.parent

            if (body.file.validate){
                var targetPath = mtx.args.outputPath + body.file.path

                if (body.file.finalize){
                    try {
                        var stat = fs.statSync(targetPath)
                        if (stat.size !== body.file.size){
                            return respondWith({valid: false})
                        }
                    } catch(err) {
                        return respondWith({valid: false})
                    }
                    return respondWith({valid: true})
                }

                try {
                    if (!fs.existsSync(targetPath)){
                        respondWith({invalid_file: true})
                    }
                } catch(err){
                    var x = 0
                }

                var match = false

                try {
                    var chunk = await this.getChunk({path: targetPath, pos: body.file.posRange.start, chunkSize: body.file.posRange.chunkSize})
                
                    //console.log(`chunk: 0=${chunk[0]}    ${chunk.length}=${chunk[chunk.length - 1]}`)

                    var crc32 = require('fast-crc32c')
                    var checksum = crc32.calculate(chunk)

                    match = checksum === body.file.checksum

                    
                } catch(err) {
                    var x = 0
                }

                if (!match){
                    try {
                        fs.removeSync(targetPath)
                    } catch(err) {
                        var x = 0
                    }
                }

                respondWith({valid: match})

                return
            }

            var route = parent.routes[body.route]
            if (!route){
                respondWith({status: false, error: 'invalid_route'})
                return
            }

            /*********/
            var tmpPath = `${mtx.paths.tmp}${body.file.uuid}.mtx_tmp_file`
            //var buffer = new Buffer.from(body.file.data, 'base64')
            
            if (!body.file.finalize){
                if (parent.onReceiveProgress) parent.onReceiveProgress(body)

                fs.ensureDirSync(mtx.paths.tmp)
                try {
                    fs.appendFileSync(tmpPath, body.file.data)
                } catch(err) {
                    console.error(err)
                    console.error(tmpPath)
                    console.error(body.file.name)
                    console.error('================')
                }
                count++
                if (count === 9){
                    var x = 0
                }
                respondWith({status: true})
            } else {
                var files = {}
                files[body.file.__name] = {
                    name: body.file.name,
                    //data: fs.readFileSync(tmpPath),
                    mv: targetPath => {
                        try {
                            fs.moveSync(tmpPath, targetPath)
                        } catch(err) {
                            console.error(err)
                            console.error('Target path: ' + targetPath)
                        }
                    },

                    unlink: ()=>{
                        fs.removeSync(tmpPath)
                    }
                }

                var req = {
                    body: body.metadata,
                    files: files
                }

                var res = {
                    send: data => { respondWith(data) },
                    ok: ()=>{ respondWith({}) }
                }

                route.cb(req, res)
                
                //respondWith({status: true, completed: true})
            }
        })
    }
}