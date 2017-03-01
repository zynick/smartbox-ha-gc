'use strict';

const async = require('async');
const debug = require('debug');
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
const log = debug('gc:appHA');
const logError = debug('gc:error');


const initializeTCP = done => {

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


async.parallel([
  initializeTCP,
  initializeMQTT
], (err, [tcp, mqtt]) => {

  if (err) {
    logError(err);
    throw err; // fail loudly
  }

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

  log('appHA started.');

});
