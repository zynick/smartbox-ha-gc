'use strict';

const log = require('debug')('gc:app:routes');
const router = require('express').Router();
const isProd = process.env.NODE_ENV === 'production';
const { version } = require('../package.json');


router.all('/', (req, res) => {

    if (!isProd) {
        log(`==========`);
        log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
        log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
        log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
        log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
        log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
    }

    res.json(`Global Cache API Server v${version}`);
});


/* 404 & Error Handlers */
router.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

router.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const error = { status, message };
    // hide stacktrace in production, show otherwise
    if (!isProd) { error.stack = err.stack; }
    res
        .status(status)
        .json({ error });
});


module.exports = router;
