'use strict';

const router = require('express').Router();
const { version } = require('../package.json');
const { settings } = require('../config.json').globalCache.tcp;
const { NODE_ENV } = process.env;


router.get('/', (req, res) => res.json(`Global Cache API Server v${version}`));

router.get('/v1/settings', (req, res) => res.json(settings));


/* 404 & Error Handlers */
router.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

router.use((err, req, res, next) => {
  const { status = 500, message = 'Internal Server Error' } = err;
  const error = { status, message };
  // hide stacktrace in production, show otherwise
  if (NODE_ENV !== 'production') { error.stack = err.stack; }
  res
    .status(status)
    .json({ error });
});


module.exports = router;
