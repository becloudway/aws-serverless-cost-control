const { LAMBDA } = require('../clients');
const log = require('../logger');

module.exports = class LambdaDimension {
    constructor({ start = new Date(), end, lambdaFunction }) {
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
        this.requestCount = await LAMBDA.calculateLambdaInvocations(this.function, this.start, this.end);
        this.averageDuration = await LAMBDA.calculateLambdaDuration(this.function, this.start, this.end);
        this.memory = await LAMBDA.getMemory(this.function);

        log.info(
            'Executions for Lambda function %s: %d - Memory: %dMb - Avg Duration: %dms',
            this.function.id, this.requestCount, this.memory, this.averageDuration,
        );

        return this;
    }
};
