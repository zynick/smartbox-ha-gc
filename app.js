'use strict';

const async = require('async');
const bodyParser = require('body-parser');
const debug = require('debug');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const MQTT = require('mqtt');
const net = require('net');

const {
  MQTT_HOST,
  MQTT_TOPIC,
  GC_HOST,
  GC_PORT,
  PORT
} = require('./config.js');
const routes = require('./routes');
const structure = require('./structure.json');
const { getErrorDescrption } = require('./lib/globalCache.js');
const logError = debug('gc:error');


const initializeTCP = done => {

  const log = debug('gc:tcp');

  const tcp = net.connect({ host: GC_HOST, port: GC_PORT },
    () => {
      log('tcp connected.');
      return done(null, tcp);
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

const initializeMQTT = done => {

  const log = debug('gc:mqtt');

  const mqtt = MQTT.connect(`mqtt://${MQTT_HOST}`, { clientId: 'smartbox_ha_gc' });

  mqtt.on('connect', () => {
    log('mqtt connected.');
    mqtt.subscribe(MQTT_TOPIC);
    done(null, mqtt);
  });

  mqtt.on('close', () => {
    const err = new Error('mqtt closed.');
    logError(err);
    throw err;
  });

  mqtt.on('error', err => {
    logError(err);
    throw err;
  });
};

const initializeServer = done => {

  const log = debug('gc:express');

  /* Initialize Express */
  const app = express();
  app.use(morgan('common'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use('/', routes);

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

  done(null, server);
};

async.parallel([
  initializeTCP,
  initializeMQTT,
  initializeServer
], (err, [tcp, mqtt, server]) => {

  if (err) {
    logError(err);
    throw err; // fail loudly
  }

  const log = debug('gc:app');

  const commands = {};
  structure.forEach(zone =>
    zone.items.forEach(item => {
      const cmds = item.commands;
      Object.keys(cmds).forEach(key => commands[key] = cmds[key]);
    })
  );

  mqtt.on('message', (topic, buffer) => {
    const key = buffer.toString();
    log(`mqtt ${topic}: ${key}`);

    if (topic === MQTT_TOPIC && commands[key]) {
      tcp.write(`${commands[key]}\r`);
    }
  });

  log('app started.');

});
