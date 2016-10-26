'use strict';

const net = require('net');
const config = require('./config.json');
const gcErrorDescription = require('./helpers/gcErrorDescription');

const client = net.connect({
    host: config.host,
    port: config.port
}, () => {
    client.write('getversion\r');

    setTimeout(() => {
        // client.write(config.commands.test + '\r');
        client.write(config.commands._9_off + '\r');
    }, 100);
});

client.on('data', (buffer) => {
    const output = buffer.toString();
    // console.log(' # ' + output);

    if (output.indexOf('unknowncommand') === 0) {
        // http://www.globalcache.com/files/docs/API-GC-100.pdf
        const errCode = parseInt(output.substr(15));
        const errDesc = gcErrorDescription(errCode);
        console.error(`Error ${errCode}: ${errDesc}`);
    } else {
        console.log(output);
    }

});

client.on('end', () => {
    // console.log('disconnected.');
});
