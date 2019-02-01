const config = require('../config');
const { PRICING } = require('../clients');

const CURRENCY = 'USD';
const groups = ['AWS-Lambda-Duration', 'AWS-Lambda-Requests'];

const getComputeUsage = (lambdaDimension) => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};

module.exports = class LambdaPricing {
    constructor() {
        this.region = config.regions.CURRENT_REGION;
    }

    async init() {
        const pricing = await PRICING.getProducts({
            serviceCode: 'AWSLambda',
            region: this.region,
        });
        this.pricing = pricing.filter(pr => groups.includes(pr.group));
        this.computePrice = this.pricing.find(p => p.unit === 'Second' || p.unit === 'seconds').pricePerUnit;
        this.requestPrice = this.pricing.find(p => p.unit === 'Requests').pricePerUnit;
    }

    calculateForLambda(dimension) {
        const computeUsage = getComputeUsage(dimension);
        const computeCharges = computeUsage * this.computePrice;
        const requestCharges = dimension.requestCount * this.requestPrice;

        return {
            region: this.region,
            currency: CURRENCY,
            resourceId: dimension.function.id,
            totalCost: computeCharges + requestCharges,
            breakdown: { computeCharges, requestCharges },
        };
    }

    calculate(lambdaDimensions) {
        return lambdaDimensions.map(d => this.calculateForLambda(d));
    }
};
