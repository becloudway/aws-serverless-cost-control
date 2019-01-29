const { differenceInSeconds } = require('date-fns');
const config = require('../config');
const { LAMBDA } = require('../clients');
const log = require('../logger');

const getForecastFactor = (start, end, forecastPeriod) => {
    const diffHours = 3600 / differenceInSeconds(end, start);
    return diffHours * forecastPeriod;
};

module.exports = class LambdaDimension {
    constructor({ start = new Date(), end, lambdaFunction }) {
        this.period = config.forecast.PERIOD_MONTHLY;
        this.start = start;
        this.end = end;
        this.function = lambdaFunction;
        this.averageDuration = 0;
        this.requestCount = 0;
        this.memory = null;
        this.dataTransferOutInternetGb = 0;
        this.dataTransferOutIntraREgionGb = 0;
        this.dataTransferOutInterRegionsGb = 0;
        this.toRegion = '';
    }

    async create() {
        const executions = await LAMBDA.calculateLambdaExecutions(this.function, this.start, this.end);
        this.requestCount = (executions * getForecastFactor(this.start, this.end, config.forecast[this.period.toUpperCase()]));
        this.averageDuration = await LAMBDA.calculateLambdaDuration(this.function, this.start, this.end);
        this.memory = await LAMBDA.getMemory(this.function);

        log.info(
            'Executions for Lambda function %s: %d - Memory: %dMb - Avg Duration: %dms',
            this.function.id, executions, this.memory, this.averageDuration,
        );

        return this;
    }
};
