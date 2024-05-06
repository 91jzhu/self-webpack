class SingleEntryPlugin {
    constructor(context, entry, name) {
        this.context = context
        this.entry = entry
        this.name = name
    }
    apply(compiler) {
        compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
            const { context, entry, name } = this
            callback()
            // compilation.addEntry()
        })
    }
}

module.exports = SingleEntryPlugin