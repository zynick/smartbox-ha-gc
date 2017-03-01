'use strict';

const async = require('async');
const bodyParser = require('body-parser');
const debug = require('debug');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const net = require('net');

const { GC_HOST, GC_PORT, PORT } = require('./config.js');
const { getErrorDescrption } = require('./lib/globalCache.js');
const log = debug('gc:app');
const logError = debug('gc:error');


const initTCP = next => {

  const tcp = net.connect({ host: GC_HOST, port: GC_PORT },
    () => {
      log('tcp connected.');
      return next(null, tcp);
    });

  tcp.on('data', buffer => {
    const output = buffer.toString();

    if (output.indexOf('unknowncommand') === 0) {
      // http://www.globalcache.com/files/docs/API-GC-100.pdf
      const code = parseInt(output.substr(15));
      const desc = getErrorDescrption(code);
      log(`Unknown Command ${code}: ${desc}`);
    } else {
      log(output);
    }

  });

  tcp.on('close', () => {
    const err = new Error('tcp closed.');
    logError(err);
    throw err;
  });

  tcp.on('error', err => {
    logError(err);
    throw err;
  });
};

const initExpress = (tcp, next) => {

  /* Initialize Express */
  const app = express();
  app.use(morgan('common'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  const router = require('./routes/index.js')(tcp);
  app.use('/', router);

  // normalize environment port into a number, string (named pipe), or false.
  const normalizePort = val => {
    const port = parseInt(val, 10);
    return isNaN(port) ? val :
      port >= 0 ? port : false;
  };
  const port = normalizePort(PORT);
  app.set('port', port);

  /* Create HTTP server. */
  const server = http.createServer(app);

  server.listen(port);

  server.on('error', err => {
    if (err.syscall !== 'listen') {
      throw err;
    }
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (err.code) {
      case 'EACCES':
        logError(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logError(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw err;
    }
  });

  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    log(`Listening on ${bind}`);
  });

  next();
};

const errorHandler = err => {
  if (err) {
    logError(err);
    throw err; // fail loudly
  }

  log('app started.');
};


async.waterfall([ initTCP, initExpress ], errorHandler);
