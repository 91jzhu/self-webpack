const path = require('path')

module.exports = {
    context: process.cwd(),
    output: {
        filename: 'bundle[contenthash:5].js',
        path: path.resolve('dist'),
    },
}