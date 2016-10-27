'use strict';

const async = require('async');
const debug = require('debug')('app:www');
const error = require('debug')('app:error'); // TODO didn't go to stderr??? https://www.npmjs.com/package/debug
const MQTT = require('mqtt');
const net = require('net');

const config = require('./config.json');
const gcErrorDescription = require('./helpers/gcErrorDescription');

let _tcpData;

const initializeTCP = (done) => {
    let callback = false;

    const {
        host,
        port
    } = config.globalCache.tcp;

    const tcp = net.connect({
        host,
        port
    }, () => {
        debug('tcp connected.');

        if (!callback) {
            callback = true;
            return done(null, tcp);
        }
    });

    _tcpData = (buffer) => {
        const output = buffer.toString();

        if (output.indexOf('unknowncommand') === 0) {
            // http://www.globalcache.com/files/docs/API-GC-100.pdf
            const errCode = parseInt(output.substr(15));
            const errDesc = gcErrorDescription(errCode);
            debug(`Error ${errCode}: ${errDesc}`);
        } else {
            debug(output);
        }
    };
    tcp.on('data', _tcpData);

    tcp.on('error', (err) => {
        if (!callback) {
            callback = true;
            return done(err);
        }
        error(err); // TODO fail loudly. shut down process?
    });
};

const initializeMQTT = (done) => {
    let callback = false;

    const {
        host,
        stateTopic,
        commandTopic
    } = config.homeAssistant.mqtt;
    const mqtt = MQTT.connect(host, {
        clientId: 'smartbox_ha_paradox'
    });

    mqtt.on('connect', () => {
        debug('mqtt connected.');
        mqtt.subscribe(stateTopic);
        mqtt.subscribe(commandTopic);

        if (!callback) {
            callback = true;
            done(null, mqtt);
        }
    });

    mqtt.on('message', (topic, buffer) => {
        const message = buffer.toString();
        debug(`mqtt ${topic}: ${message}`);
    });

    mqtt.on('offline', () => {
        const err = new Error('mqtt server offline.');
        if (!callback) {
            callback = true;
            return done(err);
        }
        error(err); // TODO fail loudly. shut down process?
    });

    mqtt.on('error', (err) => {
        if (!callback) {
            callback = true;
            return done(err);
        }
        error(err); // TODO fail loudly. shut down process?
    });
};

async.parallel([
    initializeTCP,
    initializeMQTT
], function(err, [tcp, mqtt]) {

    if (err) {
        error(err);
        process.exit(1);
        return;
    }

    const commands = config.globalCache.tcp.commands;

    tcp.write('getversion\r');

    setTimeout(() => {
        // tcp.write(commands.test + '\r');
        tcp.write(commands._9_off + '\r');
    }, 500);
});
