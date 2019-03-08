"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dimension_1 = require("./Dimension");
const logger_1 = require("../logger");
const clients_1 = require("../clients");
class LambdaDimension extends Dimension_1.Dimension {
    constructor() {
        super(...arguments);
        this._averageDuration = 0;
        this._memory = null;
        this._dataTransferOutInternetGb = 0;
        this._dataTransferOutIntraREgionGb = 0;
        this._dataTransferOutInterRegionsGb = 0;
        this._toRegion = '';
    }
    async create() {
        this._requestCount = await clients_1.lambdaClient.calculateLambdaInvocations(this.resource, this.start, this.end);
        this._averageDuration = await clients_1.lambdaClient.calculateLambdaDuration(this.resource, this.start, this.end);
        this._memory = await clients_1.lambdaClient.getMemory(this.resource);
        logger_1.log.info('Executions for LambdaClient function %s: %d - Memory: %dMb - Avg Duration: %dms', this.resource.id, this._requestCount, this._memory, this._averageDuration);
        return this;
    }
    get requestCount() {
        return this._requestCount;
    }
    get averageDuration() {
        return this._averageDuration;
    }
    get memory() {
        return this._memory;
    }
    get dataTransferOutInternetGb() {
        return this._dataTransferOutInternetGb;
    }
    get dataTransferOutIntraREgionGb() {
        return this._dataTransferOutIntraREgionGb;
    }
    get dataTransferOutInterRegionsGb() {
        return this._dataTransferOutInterRegionsGb;
    }
    get toRegion() {
        return this._toRegion;
    }
}
exports.LambdaDimension = LambdaDimension;
//# sourceMappingURL=lambdaDimension.js.map