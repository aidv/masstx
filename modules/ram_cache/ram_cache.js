var fs = require('fs-extra')
const { fdir } = require('fdir')

module.exports = class MTX_RAM_Cache {
    constructor(opt){
        this.__max_RAM_size = 1 //in GB
        this.files = {}
    }

    loadDir(path){
        var crawler = new fdir().withBasePath()
        var files = crawler.crawl(path).sync()
        for (var i in files) files[i] = files[i].split('\\').join('/')

        this.addAll(files)
    }

    addAll(files){
        for (var i in files) this.add(files[i])

        this.startCache()
    }

    add(path){
        this.files[path] = new MTX_RAM_Cache_File({path: path})
    }

    startCache(){
        var timer = setInterval(()=>{
            
        })
    }

    monitor(){
        this.timer = setInterval(()=>{

        })
    }

    get RAM_occupied(){

    }

    get max_RAM_size(){
        return this.__max_RAM_size * 1000 * 1000 * 1000
    }
}

class MTX_RAM_Cache_File {
    constructor(opt){
        this.path = opt.path
        this.chunks = []
        this.RAM_size = 0

        this.init()
    }

    init(){
        var stat = fs.statSync(this.path)
        this.size = stat.size
    }

    load(){

    }
}