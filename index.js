const resourceCostCalculator = require('./lib/resourceCostCalculator');
const resourceThrottler = require('./lib/resourceThrottler');
const anomalyDetector = require('./lib/anomalyDetector');
const costStreamer = require('./lib/costStreamer');

module.exports = {
    resourceCostCalculator: resourceCostCalculator.handler,
    costStreamer: costStreamer.handler,
    resourceThrottler: resourceThrottler.handler,
    anomalyDetector: anomalyDetector.handler,
};
