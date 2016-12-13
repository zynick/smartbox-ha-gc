'use strict';

const async = require('async');
const debug = require('debug')('app:app');
const error = require('debug')('app:error');
const MQTT = require('mqtt');
const net = require('net');

const config = require('./config.json');
const gcErrorDescription = require('./helpers/gcErrorDescription');

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
        debug(`${new Date()} tcp connected.`);

        if (!callback) {
            callback = true;
            return done(null, tcp);
        }
    });

    tcp.on('data', (buffer) => {
        const output = buffer.toString();

        if (output.indexOf('unknowncommand') === 0) {
            // http://www.globalcache.com/files/docs/API-GC-100.pdf
            const errCode = parseInt(output.substr(15));
            const errDesc = gcErrorDescription(errCode);
            debug(`${new Date()} Error ${errCode}: ${errDesc}`);
        } else {
            debug(`${new Date()} ${output}`);
        }

    });

    tcp.on('error', (err) => {
        if (!callback) {
            callback = true;
            return done(err);
        }

        debug(`${new Date()} ERROR`);
        error(err);
        process.exit(1); // fail loudly
    });
};

const initializeMQTT = (done) => {
    let callback = false;

    const {
        host,
        commandTopic
    } = config.homeAssistant.mqtt;

    const mqtt = MQTT.connect(host, {
        clientId: 'smartbox_ha_gc'
    });

    mqtt.on('connect', () => {
        debug(`${new Date()} mqtt connected.`);
        mqtt.subscribe(commandTopic);

        if (!callback) {
            callback = true;
            done(null, mqtt);
        }
    });

    mqtt.on('offline', () => {
        const err = new Error('mqtt server offline.');

        if (!callback) {
            callback = true;
            return done(err);
        }

        debug(`${new Date()} ERROR`);
        error(err);
        process.exit(1); // fail loudly
    });

    mqtt.on('error', (err) => {
        if (!callback) {
            callback = true;
            return done(err);
        }

        debug(`${new Date()} ERROR`);
        error(err);
        process.exit(1); // fail loudly
    });
};

async.parallel([
    initializeTCP,
    initializeMQTT
], (err, [tcp, mqtt]) => {

    if (err) {
        debug(`${new Date()} ERROR`);
        error(err);
        process.exit(1);
        return;
    }

    const commandTopic = config.homeAssistant.mqtt.commandTopic;
    const commands = config.globalCache.tcp.commands;

    mqtt.on('message', (topic, buffer) => {
        const key = buffer.toString();
        debug(`${new Date()} mqtt ${topic}: ${key}`);

        if (topic === commandTopic) {
            const command = commands[key];
            if (command) {
                tcp.write(`${command}\r`);
                return;
            }
        }
    });

    debug(`${new Date()} server started.`);

});
