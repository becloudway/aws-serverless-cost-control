const calculator = require('./lib/calculator');
const inhibitor = require('./lib/inhibitor');
const anomalyDetector = require('./lib/anomalyDetector');
const costStreamer = require('./lib/costStreamer');

module.exports = {
    calculator: calculator.handler,
    inhibitor: inhibitor.handler,
    anomalyDetector: anomalyDetector.handler,
    costStreamer: costStreamer.handler,
};
