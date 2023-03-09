module.exports = function (fastify, opts, done) {
    fastify.get('/', async function () {
        return {'message': 'todos'};
    })
    done()
}