const calculator = require('./lib/calculator');
const inhibitor = require('./lib/inhibitor');

module.exports = {
    calculator: calculator.handler,
    inhibitor: inhibitor.handler,
};
