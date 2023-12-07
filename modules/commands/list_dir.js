var fs = require('fs-extra')
module.exports = class MTX_Cmd {
    constructor(opt){

    }

    async exec(req, res){
        var path = req.body.target_path

        
        var list = {directories: [], files:[]}

        var entries = fs.readdirSync(path)

        for (var i in entries){
            var entry = entries[i]
            var which = (fs.lstatSync(path + entry).isDirectory() ? 'directories' : 'files')
            list[which].push(entry)
        }

        res.send({list: list})
    }
}