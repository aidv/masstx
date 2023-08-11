var fs = require('fs-extra')
const { fdir } = require('fdir')

module.exports = class FileTransfer {
    constructor(opt){
        this.list = {}

        this.stats = {
            B_sent: 0,
            MB_per_sec: 0,
            rate_top: 0
        }
    }

    addFile(path){
        this.list[path] = undefined
    }

    addFolder(path){
        var crawler = new fdir().withBasePath()
        var files = crawler.crawl(path).sync()
        this.totalFiles = files.length
        files.forEach(_e => {
            this.addFile(_e.split('\\').join('/'))
        })
    }

    async upload(opt = {}){
        if (fs.lstatSync(opt.path).isDirectory()) this.addFolder(opt.path)
        else this.addFile(opt.path)

        return await this.parallellTransfer({inputPath: opt.path, outputPath: opt.outputPath})
    }

    parallellTransfer(opt = {}){
        return new Promise(async (resolve)=>{
            var fileCount = 0
            var existingRes = {existing: []}
            if (!mtx.args.validate){
                fileCount += Object.keys(this.list).length

                console.log('Checking existing...')
                existingRes = await mtx.endpoint.post('getExisting', {})
                if (existingRes.existing.length > 0){
                    console.log(existingRes.existing.length + ' existing remote files were found')
                    for (var i in existingRes.existing){
                        var fullPath = mtx.args.inputPath + existingRes.existing[i]
                        delete this.list[fullPath]
                    }
                } else {
                    console.log('No existing remote files were found')
                }

                this.list = Object.keys(this.list)

                fileCount -= this.list.length


                if (this.list.length === 0){
                    console.log('No local files to be sent')
                    return resolve()
                }
            } else {
                this.list = Object.keys(this.list)
                fileCount += this.list.lemgth
            }

            //this.list = ['G:/datasets_fullband/clean/german_speech/CC_BY_SA_4.0_249hrs_339spk_German_Wikipedia_16k/data/German_Wikipedia_Asphalt_audio2_48kHz.wav']

            /*********/

            await mtx.endpoint.post('stats', {count: this.list.length})

            var idx = 0

            var workers = {
                max: parseInt(mtx.args.workers) || 10,
                active: 0
            }

            var startTime = Date.now()
            this.statsTimer = setInterval(()=>{
                this.stats.MB_per_sec = parseFloat((this.stats.B_sent / 1000000).toFixed(2))
                this.stats.B_sent = 0
                if (this.stats.MB_per_sec > this.stats.rate_top) this.stats.rate_top = this.stats.MB_per_sec

                var totalPercent = (100 / this.list.length) * idx

                var now = Date.now()
                var elapsed = now - startTime
                var ETA_ms = ((elapsed / totalPercent) * 100) - elapsed
                var ETA_s = ETA_ms / 1000
                var ETA_m = ETA_s / 60
                var ETA_h = ETA_m / 60
                var ETA = ETA_h
                var ETA_unit = 'h'
                if (ETA < 1){
                    ETA = ETA_m
                    ETA_unit = 'm'
                    if (ETA < 1){
                        ETA = ETA_s
                        ETA_unit = 's'
                    }
                }

                var completedCount = idx

                var failedStr = ''
                if (mtx.args.validate) failedStr = '  Failed: ' + mtx.stats.failed

                console.log(`[Workers: ${workers.active} of ${workers.max}] ${completedCount} of ${this.list.length} (${totalPercent.toFixed(2)}%)    ETA: ${ETA.toFixed(2)}${ETA_unit}       ${this.stats.MB_per_sec}MB/s (Top: ${this.stats.rate_top}MB/s)  ${failedStr}`)
            }, 1000)

            this.timer = setInterval(async ()=>{
                if (workers.active === workers.max) return

                
                

                try {
                    var nextFile = this.list[idx]


                    var complete = (preserveWorkerCount)=>{
                        if (!preserveWorkerCount) workers.active--
                        if (workers.active < 0) workers.active = 0

                        if (workers.active <= 0 && idx >= this.list.length - 1){
                            clearInterval(this.statsTimer)
                            
                            resolve()
                            clearInterval(this.timer)
                        }
                    }

                    if (!nextFile){
                        complete(true)
                        return
                    }

                    idx++

                    if (idx >= this.list.lemgth) return complete(true)

                    workers.active++

                    var filenameSplit = nextFile.split('\\').join('/').split('/')
                    var filename = filenameSplit[filenameSplit.length - 1]

                    var sourcePath = (mtx.args.inputPath || opt.inputPath).split('\\').join('/')

                    var rootPath = nextFile.replace(sourcePath, '').replace(filename, '')
                    if (!rootPath) rootPath = ''

                    

                    if (!mtx.args.validate){
                        var existRes = await mtx.endpoint.post('fileExists', {rootPath: rootPath, filename: filename})
                        if (existRes.exists){
                            //console.log(nextFile + ' already exists at destination')
                            return complete()
                        }
                    }

                    mtx.endpoint.upload({
                        route: 'upload',
                        filePath: nextFile,
                        body: {rootPath: rootPath},
                        onProgress: res => {
                            this.stats.B_sent += res.chunkSent
                            //console.log(`${nextFile}: ${res.percent}%  ${res.rate}MB/s (Top: ${res.rateTop}MB/s)`)
                        }
                    })
                    .then(res => {
                        complete()
                    })
                    .catch(err => {
                        if (err.error === 'invalid_output_path'){
                            process.exit(null, 'Remote output path does not exist. Start MTX with the -o <output path> flag on the REMOTE machine.')
                        }0
                        this.cancel()
                        var x = 0
                    })
                } catch(err) {
                    var x = 0
                }
            })
        })
    }

    cancel(){
        clearInterval(this.timer)
        console.error('CANCELLED!')
    }
}