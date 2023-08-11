const prompts = require('prompts')

module.exports = class MTX_Console {
    constructor(){
        this.history = []
        this.historyIdx = 0

        this.cwd = ''

        this.commands = {}

        this.init()

        this.prompt()
    }

    init(){
        const props = [];
        let obj = this;
        do {
            props.push(...Object.getOwnPropertyNames(obj));
        } while (obj = Object.getPrototypeOf(obj));
        
        var funcs = props.sort().filter((e, i, arr) => { 
           if (e!=arr[i+1] && typeof this[e] == 'function' && (e.indexOf('ext_') > -1 || e.indexOf('cmd_') > -1)) return true;
        })

        for (var i in funcs){
            var name = funcs[i]

            this.commands[name] = this[name]
        }

        process.stdin.setEncoding('utf8')
        process.stdin.on('data', function(key) {
            if (key == '\u001B\u005B\u0041') {
                mtx.console.historyIdx = (mtx.console.historyIdx < 1 ? 0 : mtx.console.historyIdx-1)
                mtx.console.prompt({initial: mtx.console.history[mtx.console.historyIdx]})
            }
            if (key == '\u001B\u005B\u0043') {
                //right
            }
            if (key == '\u001B\u005B\u0042') {
                mtx.console.historyIdx += 1
                if (mtx.console.historyIdx >= mtx.console.history.length - 1) mtx.console.historyIdx = mtx.console.history.length - 1
                mtx.console.prompt({initial: mtx.console.history[mtx.console.historyIdx]})
            }
            if (key == '\u001B\u005B\u0044') {
                //left
            }
        })
    }

    async prompt(opt = {}){
        const res = await prompts({
            type: 'text',
            name: 'value',
            message: this.cwd,
            initial: opt.initial
        })
        
        this.history.push(res.value)
        this.historyIdx = this.history.length - 1


        var values = res.value.split(' ')
        var cmdName = values[0]
        values.splice(0,1)

        var cmd = this.commands['cmd_' + cmdName] || this.commands['ext_' + res.value]
        if (!cmd){
            console.error('Invalid command')
            return this.prompt()
        }

        

        var ext_res = await cmd({
            input: res.value,
            cmd: cmdName,
            values: values
        })

        if (ext_res){
            if (ext_res.value) console.log(ext_res.value)
        } else {
            ext_res = {}
        }

        this.prompt({initial: ext_res.initial})
    }

    async cmd_quit(opt){
        if (opt.values.includes('now')) process.exit()

        const qRes = await prompts({
            type: 'confirm',
            name: 'value',
            initial: false,
            message: 'Are you sure that you want to quit MTX?'
        })
        if (qRes.value) process.exit()
    }

    async cmd_history(opt){
        var history = mtx.console.history

        
        var list = []

        for (var i = 0; i < history.length - 1; i++){
            var entry = history[i]
            list.push({title: entry, value: entry})
        }

        if (list.length < 1) return console.error('History is empty')


        list.push({title: '^^^  Select a previous command  ^^^', value: '', disabled: true})

        const qRes = await prompts({
            type: 'select',
            name: 'value',
            message: 'History',
            choices: list,
            initial: list.length - 2
        })  

        return {initial: qRes.value}
    }

    async ext_dir(opt){
        var res = await mtx.endpoint.post('dir', opt.values)
        for (var i in res.entries) console.log(res.entries[i])
        return
    }

    async ext_cd(opt){
        console.log('CD to ' + opt.values)
        var res = await mtx.endpoint.post('cd', opt.values)

        this.cwd = res.cwd
    }
}