const { differenceInSeconds } = require('date-fns');
const config = require('../config');
const PricingAbstract = require('./PricingAbstract');

const groups = ['AWS-Lambda-Duration', 'AWS-Lambda-Requests'];

const getComputeUsage = (lambdaDimension) => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};

module.exports = class LambdaPricing extends PricingAbstract {
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

    calculateForDimension(dimension) {
        const computeUsage = getComputeUsage(dimension);
        const computeCharges = computeUsage * this.computePrice / config.metrics.METRIC_WINDOW;
        const requestCharges = dimension.requestCount * this.requestPrice / config.metrics.METRIC_WINDOW;
        const totalCost = computeCharges + requestCharges;
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / config.metrics.METRIC_WINDOW;

        return {
            region: this.region,
            currency: this.currency,
            resourceId: dimension.resource.id,
            estimatedMonthlyCharge: LambdaPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: { computeCharges, requestCharges },
        };
    }
};
