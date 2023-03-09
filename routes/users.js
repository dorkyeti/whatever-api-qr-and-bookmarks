const bcrypt = require('bcrypt');
const saltRounds = 10;
const { DateTime } = require("luxon");
const {unprocessable, notFound, nothing, mappers} = require('../helpers');

const userMapper = mappers.user;
const roles = ['admin', 'client'];

module.exports = function (fastify, _, done) {
    fastify.get('/', async function () {
        return (await this.db.users.fetch()).items
            .map(userMapper);
    });

    fastify.get('/:id/bookmarks', async function (request) {
        return (await fastify.db.bookmarks.fetch({userId: request.params.id})).items;
    });

    fastify.post('/', async function (rq, reply) {
        let {names, username, password, role} = rq.body;

        username = username.toLowerCase().trim().split(' ').join('_');

        u = await this.db.users.fetch({ username }, { "limit" : 1 })

        if (u.count > 0) {
            unprocessable('Nombre de usuario en uso');
        }

        if (role == null || !roles.includes(role.toLowerCase()))
            role = 'Client';

        password = await bcrypt.hash(password, saltRounds);
        now = DateTime.now().setZone('America/Caracas').toISO();
        const obj = {names, username, password, role, createAt: now, updatedAt: now};

        const user = await this.db.users.put(obj);

        return reply.send(userMapper(user)).code(201);
    });

    fastify.get('/:id', async function (rq) {
        const user = await this.db.users.get(rq.params.id);
        
        if (user === null)
            notFound('Usuario no encontrado')

        return userMapper(user);
    });

    fastify.put('/:id', async function (rq, reply) {
        const user = await this.db.users.get(rq.params.id);
        
        if (user === null)
            notFound('Usuario no encontrado');

        let {names, username, password} = rq.body;

        if (username != null) {
            username = username.toLowerCase().trim().split(' ').join('_');
            u = await this.db.users.fetch({ username });
    
            if (u.items.find(
                user => user.username == username
                && user.id !== rq.params.id
            ))
                unprocessable('Nombre de usuario en uso');
            
            user['username'] = username
        }

        if (names != null)
            user['names'] = names;

        if (password != null)
            user['password'] = await bcrypt.hash(password, saltRounds); 

        user['updatedAt'] = DateTime.now().setZone('America/Caracas').toISO();
        
        const res = await this.db.users.put(user);

        return nothing(reply); 
    });

    fastify.delete('/:id', async function (rq, reply) {
        const user = await this.db.users.get(rq.params.id);
        
        if (user === null)
            notFound('Usuario no encontrado');
        
        await this.db.users.delete(rq.params.id);

        return nothing(reply);
    })

    done()
}