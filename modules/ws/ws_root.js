

module.exports = class WS_Root {
    constructor(opt){
        this.opt = opt
    }

    on(route, cb){
        mtx.dlog('[ON] ' + route)
        this.routes[route] = {route: route, cb: (req, res)=>{
            cb(req, res)
        }}

        if (this.opt.isClient) this.captureRoute(this.routes[route])
    }

    captureRoute(post){
        if (post.captured) return
        
        mtx.dlog('[captureRoute] ' + post.route)
        post.captured = true
        this.endpoint.on(post.route, async (body, respondWith)=>{
            var req = {body: body}
            
            if (body.file){
                this.fileIdx++
                var tmpPath = `/mtx/${this.fileIdx}.mtx_tmp_file`
                var tmpFileRes = await utils.streamToFile(body.file, tmpPath)
                req.files = {file: body.file}
                req.file.data = fs.readFileSync(tmpFileRes.path)
            }

            post.cb(
                req,
                {
                    send: data => { respondWith(data) },
                    ok: ()=>{
                        try { respondWith({}) } catch(err) {
                            console.error(err)
                            console.error(JSON.stringify(body))
                            console.error('POST route: ' + post.route)
                        }
                    }
                }
            )
        })
    }
    

    
    post(route, body = {}){
        return new Promise(async (resolve, reject)=>{
            try {
                mtx.dlog('[POST] ' + route)
                this.endpoint.emit(route, body, res => {
                    if (!res || res.error) reject(res)
                    else resolve(res)
                })
            } catch(err) {
                var x = 0
            }
        })
    }

    upload(opt){
        return new Promise(async (resolve, reject)=>{
            try {
                mtx.dlog('[UPLOAD] ' + opt.route)

                var res = await this.__ws_fileUpload.send({
                    route: opt.route,
                    body: opt.body || {},

                    filePath: opt.filePath,

                    onProgress: res => {
                        if (opt.onProgress) opt.onProgress(res)
                    }
                })
            } catch(err) {
                return reject(err)
            }

            resolve()
        })
    }
}