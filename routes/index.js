'use strict';

const router = require('express').Router();
const { NODE_ENV } = require('../config.js');
const controller = require('../controllers/index.js');
const structure = require('../structure.json');

// filter structure commands object to comands key array
structure.forEach(zone => {
  zone.items.forEach(item => {
    const keys = Object.keys(item.commands);
    item.commands = keys;
  });
});



if (NODE_ENV !== 'production') {
    router.use(controller.debug);
}

router.get('/', controller.index);
router.get('/v1/structure', (req, res) => res.json(structure));
router.use(controller.notFound);
router.use(controller.errorHandlerJSON);


module.exports = router;
