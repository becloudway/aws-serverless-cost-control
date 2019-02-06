const DimensionAbstract = require('./DimensionAbstract');
const { LAMBDA } = require('../clients');
const log = require('../logger');

module.exports = class LambdaDimension extends DimensionAbstract {
    constructor({ start = new Date(), end, resource }) {
        super({ start, end, resource });
        this.averageDuration = 0;
        this.requestCount = 0;
        this.memory = null;
        this.dataTransferOutInternetGb = 0;
        this.dataTransferOutIntraREgionGb = 0;
        this.dataTransferOutInterRegionsGb = 0;
        this.toRegion = '';
    }

    async create() {
        this.requestCount = await LAMBDA.calculateLambdaInvocations(this.resource, this.start, this.end);
        this.averageDuration = await LAMBDA.calculateLambdaDuration(this.resource, this.start, this.end);
        this.memory = await LAMBDA.getMemory(this.resource);

        log.info(
            'Executions for Lambda function %s: %d - Memory: %dMb - Avg Duration: %dms',
            this.resource.id, this.requestCount, this.memory, this.averageDuration,
        );

        return this;
    }
};
