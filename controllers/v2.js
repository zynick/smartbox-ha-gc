'use strict';


/**
 * filter structure commands object to comands key array
 */
const structure = require('../structure.json');
structure.forEach(zone => {
  zone.items.forEach(item => {
    item.commands = Object.keys(item.commands);
  });
});


const getStructure = (req, res) => {
  res.json(structure);
};

const postCommand = (req, res, next) => {
  const { command = '' } = req.body;
  req.tcp.write(`${command}\r`, next);
}

const postCommandEnd = (req, res) => {
  res.status(200).end();
};


module.exports = {
  getStructure,
  postCommand,
  postCommandEnd
};
