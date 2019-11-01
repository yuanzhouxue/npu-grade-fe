'esversion 6'

const http = require('http')

exports.main = async (event, context) => {
    let res = await new Promise(function (resolve, reject) {
        http.get('http://v3.wufazhuce.com:8000/api/channel/one/0/0', (res) => {
            let html = ''
            res.on('data', (chunk) => {
                res.setEncoding('utf8')
                html += chunk
            })
            res.on('end', () => {
                resolve(html)
            })
            res.on('error', (e) => {
                reject(e)
            })
        })
    })
    return res
}
