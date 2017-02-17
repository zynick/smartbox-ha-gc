'use strict';

const router = require('express').Router();
const { NODE_ENV } = require('../config.js');
const controller = require('../controllers/index.js');
const settings = require('../settings.json');


if (NODE_ENV !== 'production') {
    router.use(controller.debug);
}

router.get('/', controller.index);
router.get('/v1/settings', (req, res) => res.json(settings));
router.use(controller.notFound);
router.use(controller.errorHandlerJSON);


module.exports = router;
