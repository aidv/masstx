var fs = require('fs')

module.exports = class Utils {
    constructor(opt){

    }

    fixPath(path){
        path = path.split('\\').join('/').split('//').join('/')

        var split = path.split('/')
        if (split[split.length - 1].split('.').length === 1){
            var lastChar = path[path.length - 1]
            if (lastChar !== '/') path += '/'
        }
        
        return path
    }

    arrayToObject(opt){
        var list = {}

        for (var i in opt.array){
            var item = opt.array[i]

            var newPath = opt.replacePathWith

            if (opt.keepLastSubpath){
                var split = newPath.split('/')
                
                if (split[split.length - 1].length === 0) split.splice(split.length - 1, 1)

                split.splice(split.length - 1, 1)

                newPath = split.join('/') + '/'
            }

            list[item.path.split('\\').join('/').replace(newPath, '/')] = item
        }

        return list
    }

    streamToFile(stream, path){
        return new Promise(async (resolve, reject)=>{
            try {
                fs.writeFile(
                    path,
                    stream,
                    'binary',
                    err => {
                        console.error('Failed to save stream!', err)
                        reject()
                    }
                )

                resolve({path: path})
            } catch(err) {
                console.error('[WS] Failed to save stream!', err)
                reject()
            }
        })
    }
}