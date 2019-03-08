"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dimension_1 = require("./dimension");
const pricing_1 = require("./pricing");
const config_1 = require("./config");
const logger_1 = require("./logger");
const pricings = new Map();
pricings.set(config_1.SERVICE_DYNAMODB, pricing_1.DynamoDBPricing);
pricings.set(config_1.SERVICE_LAMBDA, pricing_1.LambdaPricing);
pricings.set(config_1.SERVICE_RDS, pricing_1.RDSPricing);
const dimensions = new Map();
dimensions.set(config_1.SERVICE_DYNAMODB, dimension_1.DynamoDBDimension);
dimensions.set(config_1.SERVICE_LAMBDA, dimension_1.LambdaDimension);
dimensions.set(config_1.SERVICE_RDS, dimension_1.RDSDimension);
class CostRecord {
    constructor(resource) {
        this._resource = resource;
        this.Pricing = pricings.get(resource.service);
        this.Dimension = dimensions.get(resource.service);
    }
    async fetch({ start, end }) {
        const costDimension = await new this.Dimension(this._resource, start, end).create();
        const pricingScheme = await new this.Pricing().init();
        this._pricing = pricingScheme.calculateForDimension(costDimension);
        logger_1.log.info(`Cost record for ${this._resource.service.toUpperCase()}`, this._pricing);
        return this;
    }
    get resource() {
        return this._resource;
    }
    get pricing() {
        return this._pricing;
    }
}
exports.CostRecord = CostRecord;
//# sourceMappingURL=CostRecord.js.map