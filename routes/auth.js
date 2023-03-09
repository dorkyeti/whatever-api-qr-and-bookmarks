const bcrypt = require('bcrypt');
const saltRounds = 10;
const { DateTime } = require("luxon");
const strings 	= require('../strings');
const { unprocessable, notFound, nothing, serverError, mappers } = require('../helpers');
const userMapper = mappers.user;

module.exports = function (fastify, opts, done) {
    fastify.post('/register', async function (rq, reply) {
        let { names, username, password } = rq.body;

        username = username.toLowerCase().trim().split(' ').join('_');

        u = await this.db.users.fetch({ username }, { "limit": 1 })

        if (u.count > 0) {
            unprocessable('Nombre de usuario en uso');
        }

        role = 'Client';

        password = await bcrypt.hash(password, saltRounds);
        now = DateTime.now().setZone('America/Caracas').toISO();
        const obj = { names, username, password, role, createAt: now, updatedAt: now };

        const user = await this.db.users.put(obj);

        return reply.send(userMapper(user)).code(201);
    })

    fastify.post('/login', async function (rq) {
        let { username, password } = rq.body;

        username = username.toLowerCase().trim().split(' ').join('_');

        if (username === null || password === null)
            unprocessable('No puede haber campos vacios');

        u = await this.db.users.fetch({ username }, { "limit": 1 });

        if (u.count != 1)
            unprocessable('Usuario no encontrado');

        user = u.items[0];

        if (!bcrypt.compare(password, user.password))
            serverError();
        
        const token = await strings.random(20);

        const tokenModel = await this.db.tokens.put({
            token: strings.sha256(token),
            userId: user.key
        }, null, {
            expireIn: 604800
        });

        return { token };
    });

    fastify.get('/me', async function (rq) {
        // TODO GET TOKEN AND USER
        return userMapper(rq.user);
    })

    done()
}