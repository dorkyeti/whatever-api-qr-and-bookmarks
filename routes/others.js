const { unprocessable, notFound } = require('../helpers');

module.exports = function (fastify, opts, done) {
    fastify.post('/peekalink', async function ({ body }) {
        const { url } = body;

        if (url == null) {
            unprocessable('Se necesita la url');
        }

        if (!await this.peekalink.isAvailable(url))
            return notFound('Link no valido');

        const data = await this.peekalink.preview(url);

        return {
            'url': data['redirected'] ? data['redirectionUrl'] : data['url'],
            'name': data['title'],
            'description': data['description'],
            'image': data['image']['url']
        };
    });

    done()
}