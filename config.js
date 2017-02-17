'use strict';

const {
  MQTT_HOST = 'localhost',
  MQTT_TOPIC = 'smartbox/globalcache/set',
  GC_HOST = 'localhost', // 192.168.8.201 (showroom)
  GC_PORT = 4998,
  NODE_ENV = 'development',
  PORT = 3030
} = process.env;

module.exports = {
  MQTT_HOST,
  MQTT_TOPIC,
  GC_HOST,
  GC_PORT,
  NODE_ENV,
  PORT
};