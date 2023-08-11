var fs = require('fs-extra')
const { program } = require('commander')
var utils = new (require('./modules/utils.js'))()

global.WS_Root = require('./modules/ws/ws_root.js')
global.MTX_Core = require('./modules/mtx_core/core.js')

const os = require("os")

program
    .option('-d, --debug', 'output extra debugging')
    .option('-p, --port <number>', 'Port. Default 5487', 5487)
    .option('-s, --asServer', 'Start as a server, rather than a client.')
    .option('-t, --target <type>', 'That server to connect to')
    
    .option('-i, --inputPath <type>', 'The path to send to target')
    .option('-o, --outputPath <type>', 'The target path where to store the files')
    .option('-f, --forceRemote', 'For debug purposes')
    .option('-w, --workers <number>', 'How many concurrent upload streams to allow. Default is 20. More is not necessarily better.', 20)
    .option('-c, --tempFolder <type>', 'Temporary folder path')
    .option('-v, --validate', 'Validate local and remote files using CRC checksum')


program.parse(process.argv)

const opt = program.opts()



if (opt.inputPath){
    opt.inputPath = opt.inputPath.split('\\').join('/')
    if (opt.inputPath[opt.inputPath.length - 1] !== '/') opt.inputPath += '/'
}
if (opt.outputPath){
    opt.outputPath = opt.outputPath.split('\\').join('/')
    if (opt.outputPath[opt.outputPath.length - 1] !== '/') opt.outputPath += '/'
}


global.mtx = {
    exit: {
        original: process.exit,
        new: ()=>{
            try { fs.removeSync(mtx.paths.tmp) } catch(err) {}
            mtx.exit.original()
        },
    },

    dlog: str => { if (opt.debug) console.log(str) },
    args: opt,
    paths: {
        
    },

    stats: {
        timer: undefined,
        transfer:  {count: 0, completed: 0},
        list: {'>': ''}
    },

    fileUUID: 0
}

if (opt.validate){
    mtx.stats.failed = 0
    console.log('Validating ' + opt.inputPath)
} else {
    console.log('Transmitting ' + opt.inputPath)
}

process.exit = (msg, err)=>{
    if (msg) console.log(msg)
    if (err) console.error(err)

    mtx.exit.new()
}



if (opt.version){
    const PACKAGE_VERSION = require("./package.json").version;
    process.exit('MTX ' + PACKAGE_VERSION + '\nhttps://mass-tx.com')
}


/**/

process.stdin.resume();//so the program will not close instantly


function exitHandler(options, exitCode) {
    //if (options.cleanup) console.log('clean');
    //if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

process.once('uncaughtException', async _e => {
    process.exit(null, _e)
})

const others = [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]
others.forEach((eventType) => {
    process.on(eventType, exitHandler.bind(null, { exit: true }));
})

/**/

if (!opt.asServer && !opt.target) process.exit(null, 'Must define target when in client mode')


mtx.type = 'server'
if (!opt.asServer) mtx.type = 'client'

if (!opt.tempFolder){
    mtx.paths.tmp = `${os.tmpdir()}/mtx_tmp_${mtx.type}/`.split('\\').join('/')
} else {
    mtx.paths.tmp = opt.tempFolder.split('\\').join('/')
    fs.ensureDirSync(mtx.paths.tmp)
}
fs.removeSync(mtx.paths.tmp)



//if statment required for pkg so it can compile correctly
if (mtx.args.asServer) mtx.module = new (require('./modules/mtx_core/server.js'))({type: mtx.type})
else mtx.module = new (require('./modules/mtx_core/client.js'))({type: mtx.type})