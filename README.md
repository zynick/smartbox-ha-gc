# Home Assistant - Global Cache

Home Assistant - Global Cache Adapter thru MQTT

## Execute

to start ```npm start```

to debug ```npm run dev```

## MQTT debug

subscribe (monitor)
```
mosquitto_sub -v -t 'smartbox/globalcache/set'
```

publish
```
mosquitto_pub -t 'smartbox/globalcache/set' -m 'tv_onnoff'
```
