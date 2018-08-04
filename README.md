ExpREST
==========

A RESTful web API framework based on [Express](https://expressjs.com/).

**All APIs now are NOT stable, and under developing.**

API
----------

### Middlewares

#### `branchRoute(reducer, handlersMap[, options])`

For branching a route depends on specific property from request object. This will be much useful in roles based request handling. And many other scenarios.

`reducer(req)` is a function will return a value to determine which handler by the value key from request should be used.

`handlersMap` is a plain object contains key-handler pairs. Each handler is a standard express middleware function with `req`, `res` and `next` parameters be passed in.

`options` is an object has 2 optional default handlers to be configured: `keyNotFound` and `handlerNotSet`.

~~~
app.get('/user', branchRoute(function (req) {
    return req.session.role;
}, {
    user: [
        function (req, res) {
            user.get(req.session.id).then(function (result) {
                res.data(result);
            })
        }
    ],
    admin(req, res) {
        user.getAll(results).then(function (results) {
            res.data(results);
        });
    }
}, {
    keyNotFound(req, res) {
        return res.notfound();
    },

    handlerNotSet(req, res) {
        return res.notfound();
    }
}));
~~~

#### `meta`

Only add a object named `meta` to the request object for holding any request based variables.

Recommend to use in global. And will be required by `pagination` and `validation`.

#### `response`

Add a lot of method based on HTTP status code to do RESTful styled responses:

* `data(data)`: `200`
* `created(data)`: `201`
* `accepted()`: `202`
* `ok()`: `204`
* `done()`: `205`
* `badrequest(data)`: `400`
* `unauthorized()`: `401`
* `forbidden()`: `403`
* `notfound()`: `404`
* `mehtodnotallow()`: `405`
* `conflict()`: `409`
* `invalid(fields)`: `422`
* `error(errors)`: `500`
* `unavailable()`: `503`

~~~
app.get('/book/:id', function (req, res) {
    bookService.get(req.params.id).then(result => {
        res.data(result);
    }).catch(() => {
        res.notfound();
    });
});
~~~

#### `pagination(options)`

Provide a middleware to parse pagination parameters from query or other part based on request, and a output method named `paged()` to calculate real page based on data rows and all count.

By default, it use `query` as source and `page`/`size` for input. They could be changed in options.

~~~
app.get('/book', pagination({
    from: 'query', // could use `params`/`headers` and so on
    pageKey: 'page',
    sizeKey: 'size'
}), function (req, res) {
    bookService.getAll({ name: req.query.name }, req.meta.paginator).then(({ count, rows }) => {
        res.paged({ count, rows });
    });
});
~~~

`pagination` middleware requires `meta` to be used before.

#### `validation(schema)`

Provide input validation before a request goes into main business logic by using [express-validation](https://github.com/andrewkeig/express-validation) and [Joi](https://github.com/hapijs/joi).

When invalid input happens, will return a `422` status code with all error fields in body to client.

~~~
app.post('/book', validation({
    body: {
        name: joi.string().required(),
        auther: joi.string().required()
    },
    allowUnknownBody: false
}), function (req, res) {
    bookService.create(req.body).then(result => {
        res.created(result);
    })
})
~~~

`validation` middleware requires `response` to be used before.

### ModelService

Wrapped commonly used CRUD methods in [Sequelize](https://github.com/sequelize/sequelize/) ORM. All `where` and `options` are same in Sequelize could be checked in its docs.

### `constructor`

~~~
const bookService = new ModelService({
    name: 'Book' // model name in sequelize model definition
});
~~~

### `async get(id, options)`

Get a row by primary key.

### `async getOne(where = {}, options = {})`

Get one row based on `where` conditions and `options`.

### `async getAll(where = {}, options = {})`

Get a list based on `where` conditions and `options`.

### `async update(id, data, options = {})`

Update a row by primary key.

### `async remove(id, options = {})`

Remove a row by primary key.

### `async changePriority(item, span, where = {})`

For ordering rows by a manual priority key.

MIT Licensed
----------
