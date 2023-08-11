var fs = require('fs-extra')

module.exports = class MTX_Core {
    constructor(opt){
    }

    sleep(delay = 1000){
        return new Promise(resolve => {
            setTimeout(()=>{
                resolve()
            }, delay)
        })
    }

    __init(){
        const props = [];
        let obj = this;
        do {
            props.push(...Object.getOwnPropertyNames(obj));
        } while (obj = Object.getPrototypeOf(obj));
        
        var funcs = props.sort().filter((e, i, arr) => { 
           if (e!=arr[i+1] && typeof this[e] == 'function' && e.indexOf('on_') > -1) return true;
        })

        for (var i in funcs){
            var name = funcs[i]

            var route = name.replace('on_', '')
            this.addRoute(route)
        }
    }

    addRoute(route){
        mtx.endpoint.on(route, (res, req)=>{
            mtx.module['on_' + route](res, req)
        })
    }

    on_fileExists(req, res){
        var targetPath = mtx.args.outputPath + (req.body.rootPath || '') + req.body.filename
        var exists = fs.existsSync(targetPath)
        if (exists) console.log(targetPath + ' already exists. Ignoring.')
        res.send({exists: exists})
    }

    on_getExisting(req, res){
        const { fdir } = require('fdir')
        
        var crawler = new fdir().withBasePath()
        var files = crawler.crawl(mtx.args.outputPath).sync()
        for (var i = 0; i < files.length; i++) files[i] = files[i].split('\\').join('/').replace(mtx.args.outputPath, '')

        res.send({existing: files})
    }

    on_error(req, res){
        console.error('[ERROR] ' + res.error)
        res.ok()
    }
    
    on_stats(req, res){
        mtx.stats.transfer.count = req.body.count
        res.ok()
    }


    on_upload(req, res){
        /*if (!mtx.args.asServer){
            var exists = fs.existsSync(req.body.outputPath)
        } else {
            var exists = fs.existsSync(mtx.args.outputPath)
        }*/

        var exists = fs.existsSync(mtx.args.outputPath)
        
        if (!exists) return res.send({error: 'invalid_output_path'})

        mtx.stats.transfer.completed++

        req.files.file.mv(mtx.args.outputPath + (req.body.rootPath || '') + req.files.file.name)


        res.ok()
    }
}