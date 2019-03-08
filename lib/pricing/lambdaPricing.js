"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const Pricing_1 = require("./Pricing");
const config_1 = require("../config");
const groups = ['AWS-LambdaClient-Duration', 'AWS-LambdaClient-Requests'];
const getComputeUsage = (lambdaDimension) => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};
class LambdaPricing extends Pricing_1.Pricing {
    calculateForDimension(dimension) {
        const computeUsage = getComputeUsage(dimension);
        const computeCharges = computeUsage * this.computePrice / config_1.metrics.METRIC_WINDOW;
        const requestCharges = dimension.requestCount * this.requestPrice / config_1.metrics.METRIC_WINDOW;
        const totalCost = computeCharges + requestCharges;
        const costWindowSeconds = date_fns_1.differenceInSeconds(dimension.end, dimension.start) / config_1.metrics.METRIC_WINDOW;
        return {
            currency: this.currency,
            estimatedMonthlyCharge: LambdaPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: { computeCharges, requestCharges },
        };
    }
    async init() {
        const pricing = await this.pricingClient.getProducts({
            serviceCode: 'AWSLambda',
            region: this.region,
        });
        this.pricing = pricing.filter(pr => groups.includes(pr.group));
        this.computePrice = this.pricing.find(p => p.unit === 'Second' || p.unit === 'seconds').pricePerUnit;
        this.requestPrice = this.pricing.find(p => p.unit === 'Requests').pricePerUnit;
        return this;
    }
}
exports.LambdaPricing = LambdaPricing;
//# sourceMappingURL=lambdaPricing.js.map