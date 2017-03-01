'use strict';

const router = require('express').Router();
const { NODE_ENV } = require('../config.js');
const controller = require('../controllers/index.js');
const v2 = require('../controllers/v2.js');


module.exports = tcp => {

  const injectTCP = (req, res, next) => {
    req.tcp = tcp;
    next();
  };


  if (NODE_ENV !== 'production') {
    router.use(controller.debug);
  }

  router.get('/', controller.index);

  router.get('/v2/structure', v2.getStructure);

  router.post('/v2/command',
    injectTCP,
    v2.postCommand,
    v2.postCommandEnd);

  router.use(controller.notFound);
  router.use(controller.errorHandlerJSON);


  return router;

};
