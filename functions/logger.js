const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'scc',
    level: 'debug',
});

module.exports = log;
