const fastify = require('fastify')({ logger: true });
require('dotenv').config();
require('./helpers')(fastify);
const { mappers } =  require('./helpers');
const strings = require('./strings');

fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/helmet'));
fastify.register(require('./routes/auth'));
fastify.register(require('./routes/others'));
fastify.register(require('./routes/bookmarks'), { prefix: 'bookmarks' });
fastify.register(require('./routes/qrs'), { prefix: 'qrs' });
fastify.register(require('./routes/todos'), { prefix: 'todos' });
fastify.register(require('./routes/users'), { prefix: 'users' });

fastify
    .addHook('onRequest', async function (request, reply) {
        if (['/all', '/login', '/register', '/peekalink'].includes(request.url)) {
            return;
        }

        const header = request.headers['authorization'] || null;

        if (header === null) 
            throw { statusCode: 401, message: "Sin token" }
        
        let token   =   header.startsWith('Bearer ') ? header.substr(7) : header;
        token       =   strings.sha256(token);
        token       =   await this.db.tokens.fetch({ token })

        if (token.count != 1)
            throw { statusCode: 401, message: "Sin autorizacion" }

        user = await this.db.users.get(token.items[0].userId)
        request.user = {id: user.key, names: user.names, role: user.role, username: user.username}

        if (request.url.indexOf('/users') >= -1 && request.user.role !== 'Admin')
            throw { statusCode: 401, message: "Sin autorizacion" }
    })

if (process.env.DETA_RUNTIME) {
    module.exports = fastify;
} else {
    (async function () {
        try {
            await fastify.listen({ port: process.env.PORT })
        } catch (err) {
            fastify.log.error(err)
            process.exit(1)
        }
    })()
}