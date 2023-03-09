const { Base, Drive } = require('deta');
const fetch = require('node-fetch');

module.exports = function (fastily) {
    fastily.decorate('db', {
        'bookmarks': Base(process.env.DB_PREFIX + 'bookmarks'),
        'tokens': Base(process.env.DB_PREFIX + 'tokens'),
        'todos': Base(process.env.DB_PREFIX + 'todos'),
        'users': Base(process.env.DB_PREFIX + 'users'),
        'qrs': Base(process.env.DB_PREFIX + 'qrs')
    });

    fastily.decorate('peekalink', {
        isAvailable: async (url) => {
            const response = await fetch('https://api.peekalink.io/is-available/', {
                method: 'post',
                body: JSON.stringify({ "link": url }),
                headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.PEEKALINK_TOKEN }
            });
            const data = await response.json();
            return data.isAvailable;
        },
        preview: async (url) => {
            const response = await fetch('https://api.peekalink.io/', {
                method: 'post',
                body: JSON.stringify({ "link": url }),
                headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.PEEKALINK_TOKEN }
            });
            const data = await response.json();
            return data;
        }
    });
}

module.exports.notFound = (message = 'Recurso no encontrado') => { throw { statusCode: 404, message } }
module.exports.serverError = (message = 'Error en el servidor', statusCode = 500) => { throw { statusCode, message } }
module.exports.unprocessable = (message) => { throw { statusCode: 422, message } }
module.exports.nothing = (reply) => { reply.status(204) }


module.exports.mappers = {
    'user': ({ key, names, createAt, updatedAt, username, role }) => ({ id: key, names, username, role, createAt, updatedAt }),
}