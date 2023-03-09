const { DateTime } = require("luxon");
const {unprocessable, notFound, nothing, mappers, serverError} = require('../helpers');

module.exports = function (fastify, opts, done) {
    fastify.get('/all', async function (request) {
        if (request.user.role != 'Admin')
            throw { statusCode: 403, message: "No autorizado" }

        return (await fastify.db.bookmarks.fetch()).items;
    });

    fastify.get('/all/read', async function (request) {
        if (request.user.role != 'Admin')
            throw { statusCode: 403, message: "No autorizado" }
            
        return (await fastify.db.bookmarks.fetch({"readAt?ne": null})).items;
    });

    fastify.get('/all/unread', async function (request) {
        if (request.user.role != 'Admin')
            throw { statusCode: 403, message: "No autorizado" }
            
        return (await fastify.db.bookmarks.fetch({"read": null})).items;
    });

    fastify.get('/', async function (request) {
        return (await fastify.db.bookmarks.fetch({userId: request.user.id})).items;
    });

    fastify.get('/read', async function (request) {
        return (await fastify.db.bookmarks.fetch({
            userId: request.user.id,
            "readAt?ne": null
        })).items;
    });

    fastify.get('/unread', async function (request) {
        return (await fastify.db.bookmarks.fetch({
            userId: request.user.id,
            "readAt": null
        })).items;
    });

    fastify.post('/', async function (request, reply) {
        const { url, notes, categories } = request.body;
        const userId = request.user.id;

        if (url == null) {
            unprocessable('Se necesita la url');
        }

        now = DateTime.now().setZone('America/Caracas').toISO();
        
        let json = {
            'name': '',
            'url': url,
            'image': '',
            'description': '',
            'notes': notes ?? null,
            'readAt': null,
            'userId': userId,
            'categories': categories ?? [],
            'createdAt':now,
            'updatedAt':now
        };

        try {
            if ((await fastify.peekalink.isAvailable(url))) {
                const data      =   await fastify.peekalink.preview(url)
                json['url']     =   data['redirected'] ? data['redirectionUrl'] : data['url'];
                json['name']    =   data['title'];
                json['description']   =   data['description'];
                json['image']   =   data['image']['url']
            }
        } catch {
            console.error('El endpoint fallo');
        }

        const bookmark = await this.db.bookmarks.put(json);

        return reply.send(bookmark).code(201);
    });

    fastify.get('/:id', async function (request) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        bookmark = (await fastify.db.bookmarks.fetch(query)).items[0];

        if (bookmark == null)
            notFound()
        
        return bookmark
    });

    fastify.put('/:id', async function (request, reply) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        bookmark = (await fastify.db.bookmarks.fetch(query)).items[0];

        if (bookmark == null)
            notFound()
        
        const { notes, name } = request.body

        if (notes != null)
            bookmark['notes'] = notes;

        if (name != null)
            bookmark['name'] = name

        if (name != null || notes != null) {
            bookmark['updatedAt'] = DateTime.now().setZone('America/Caracas').toISO();

            await this.db.bookmarks.put(bookmark)

            return nothing(reply)
        }

        return serverError()
    });

    fastify.put('/:id/read', async function (request, reply) {
        query = {key: request.params.id, "readAt?ne": null};

        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        bookmark = (await fastify.db.bookmarks.fetch(query)).items[0];

        if (bookmark == null)
            notFound()

        const now = DateTime.now().setZone('America/Caracas').toISO();

        bookmark.readAt = now;
        bookmark.updatedAt = now;

        await this.db.bookmarks.put(bookmark);
        
        return nothing(reply)
    });

    fastify.delete('/:id', async function (request, reply) {
        query = {key: request.params.id};
        if (request.user.role != 'Admin')
            query['userId'] = request.user.id;

        bookmark = (await fastify.db.bookmarks.fetch(query)).items[0];

        if (bookmark == null)
            notFound()
            
        (await fastify.db.bookmarks.delete(request.params.id));

        return nothing(reply);
    });

    done()
}