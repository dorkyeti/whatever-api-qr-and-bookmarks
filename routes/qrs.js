const { serverError, nothing } = require("../helpers");

module.exports = function (fastify, opts, done) {
    fastify.get('/all', async function (request) {
        if (request.user.role != 'Admin')
            throw { statusCode: 403, message: "No autorizado" }

        return (await fastify.db.qrs.fetch()).items;
    });

    fastify.get('/', async function (request) {
        return (await fastify.db.qrs.fetch({userId: request.user.id})).items;
    });

    fastify.post('/', async function (request, reply) {
        const {name, value, type, notes, categories} = request.body;
        const userId = request.user.id;

        if (value == null) {
            unprocessable('Se necesita el valor');
        }

        if (type == null) {
            unprocessable('Se necesita el tipo');
        }

        now = DateTime.now().setZone('America/Caracas').toISO();

        const qr = await this.db.qrs.put({
            name,
            value,
            type,
            notes: notes ?? null, 
            categories: categories ?? [], 
            userId,
            'createdAt':now,
            'updatedAt':now
        });

        return reply.send(qr).code(201);
    });

    fastify.get('/:id', async function (request) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        qr = (await fastify.db.qrs.fetch(query)).items[0];

        if (qr == null)
            notFound()
        
        return qr
    });

    fastify.put('/:id', async function (request, reply) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        qr = (await fastify.db.qrs.fetch(query)).items[0];

        if (qr == null)
            notFound()
        
        const {name, notes, categories} = request.body;

        if (name != null)
            qr.name = name;
        
        if (notes != null)
            qr.notes = notes;
        
        if (categories != null)
            qr.categories = categories

        if ((name != null) || (notes != null) || (categories != null)) {
            qr.updatedAt = DateTime.now().setZone('America/Caracas').toISO();

            await this.db.qrs.put(qr);

            return nothing(reply);
        }
        
        return serverError();
    });

    fastify.delete('/:id', async function (request, reply) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        qr = (await fastify.db.qrs.fetch(query)).items[0];

        if (qr == null)
            notFound()

        await this.db.qrs.delete(request.params.id);
        
        return nothing(reply);
    });

    done()
}