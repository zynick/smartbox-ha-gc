'use strict';

const async = require('async');
const bodyParser = require('body-parser');
const debug = require('debug');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const MQTT = require('mqtt');
const net = require('net');

const config = require('./config.json');
const gcErrorDescription = require('./helpers/gcErrorDescription');
const logError = debug('gc:error');
const routes = require('./routes');


const initializeTCP = (done) => {

    const log = debug('gc:tcp');
    const { host, port } = config.globalCache.tcp;

    const tcp = net.connect({
        host,
        port
    }, () => {
        log('tcp connected.');
        return done(null, tcp);
    });

    tcp.on('data', (buffer) => {
        const output = buffer.toString();

        if (output.indexOf('unknowncommand') === 0) {
            // http://www.globalcache.com/files/docs/API-GC-100.pdf
            const code = parseInt(output.substr(15));
            const desc = gcErrorDescription(code);
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

    tcp.on('error', (err) => {
        logError(err);
        throw err;
    });
};

const initializeMQTT = (done) => {

    const log = debug('gc:mqtt');
    const { host, commandTopic } = config.homeAssistant.mqtt;

    const mqtt = MQTT.connect(host, {
        clientId: 'smartbox_ha_gc'
    });

    mqtt.on('connect', () => {
        log('mqtt connected.');
        mqtt.subscribe(commandTopic);
        done(null, mqtt);
    });

    mqtt.on('close', () => {
        const err = new Error('mqtt closed.');
        logError(err);
        throw err;
    });

    mqtt.on('error', (err) => {
        logError(err);
        throw err;
    });
};

const initializeServer = (done) => {

    const log = debug('gc:express');

    /* Initialize Express */
    const app = express();
    app.use(morgan('common'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use('/', routes);

    // normalize environment port into a number, string (named pipe), or false.
    function normalizePort(val) {
        const port = parseInt(val, 10);
        if (isNaN(port)) {
            return val;
        }
        if (port >= 0) {
            return port;
        }
        return false;
    }
    const port = normalizePort(process.env.PORT || 3000);
    app.set('port', port);

    /* Create HTTP server. */
    const server = http.createServer(app);

    server.listen(port);

    server.on('error', (err) => {
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
    const { commandTopic } = config.homeAssistant.mqtt;
    const { settings } = config.globalCache.tcp;
    const commands = {};
    settings.forEach((setting) => {
        setting.items.forEach((item) => {
            const cmds = item.commands;
            Object.keys(cmds).forEach((key) => {
                commands[key] = cmds[key];
            })
        });
    });

    mqtt.on('message', (topic, buffer) => {
        const key = buffer.toString();
        log(`mqtt ${topic}: ${key}`);

        if (topic === commandTopic && commands[key]) {
            tcp.write(`${commands[key]}\r`);
        }
    });

    log('app started.');

});
