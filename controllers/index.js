'use strict';

const log = require('debug')('gc:app:controllers');
const { NODE_ENV } = require('../config.js');
const { version } = require('../package.json');


const debug = (req, res, next) => {
  log('==========');
  log(`HEADERS: ${JSON.stringify(req.headers, null, 2)}`);
  log(`QUERY: ${JSON.stringify(req.query, null, 2)}`);
  log(`COOKIES: ${JSON.stringify(req.cookies, null, 2)}`);
  log(`PARAMS: ${JSON.stringify(req.params, null, 2)}`);
  log(`BODY: ${JSON.stringify(req.body, null, 2)}`);
  // res.setHeader('Access-Control-Allow-Credentials', 'true');
  // res.setHeader('Access-Control-Allow-Origin', '*');
  next();
};

const index = (req, res) => {
  res.json(`ha-gc API Server v${version}`);
}

const badRequest = (req, res, next) => {
  const err = new Error('Bad Request');
  err.status = 400;
  next(err);
};

const notFound = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

const errorHandlerJSON = (err, req, res, next) => {
  const { status = 500, message = 'Internal Server Error' } = err;
  const error = { status, message };
  // hide stacktrace in production, show otherwise
  if (NODE_ENV !== 'production') { error.stack = err.stack; }
  res
    .status(status)
    .json({ error });
};

const errorHandlerRender = (err, req, res, next) => {
  const { status = 500, message = 'Internal Server Error' } = err;
  const error = { status, message };
  // hide stacktrace in production, show otherwise
  if (NODE_ENV !== 'production') { error.stack = err.stack; }
  res
    .status(status)
    .render('error', { error });
};


module.exports = {
  debug,
  index,
  badRequest,
  notFound,
  errorHandlerJSON,
  errorHandlerRender
};
