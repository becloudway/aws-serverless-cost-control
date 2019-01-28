const config = require('../config');
const { PRICING } = require('../clients');

const CURRENCY = 'USD';
const THOUSAND = 1000;
const ONE_MILLION = 1000 * 1000;
const FREE_TIER_COMPUTE_ALLOWANCE = 400 * THOUSAND;
const FREE_TIER_REQUEST_ALLOWANCE = ONE_MILLION;

const getMonthlyComputeUsage = (lambdaDimension) => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};

module.exports = class LambdaPricing {
    constructor() {
        this.region = config.regions.CURRENT_REGION;
    }

    async init() {
        this.pricing = await PRICING.getProducts({
            serviceCode: 'AWSLambda',
            region: this.region,
        });
    }

    calculate(lambdaDimensions, { includeFreeTier }) {
        const monthlyComputePrice = this.pricing.find(p => p.unit === 'Second' || p.unit === 'seconds').pricePerUnit;
        const monthlyRequestPrice = this.pricing.find(p => p.unit === 'Requests').pricePerUnit;

        const monthlyComputeUsage = lambdaDimensions.reduce((acc, f) => acc + getMonthlyComputeUsage(f), 0);
        const billableMonthlyComputeUsage = Math.max(includeFreeTier ? monthlyComputeUsage - FREE_TIER_COMPUTE_ALLOWANCE : monthlyComputeUsage, 0);
        const monthlyComputeCharges = Math.round(billableMonthlyComputeUsage * monthlyComputePrice * 100) / 100;

        const monthlyRequests = lambdaDimensions.reduce((acc, f) => acc + f.requestCount, 0);
        const billableMonthlyRequests = Math.max(includeFreeTier ? monthlyRequests - FREE_TIER_REQUEST_ALLOWANCE : monthlyRequests, 0);
        const monthlyRequestCharges = Math.round(billableMonthlyRequests * monthlyRequestPrice * 100) / 100;

        return {
            region: this.region,
            currency: CURRENCY,
            monthlyComputeCharges: monthlyComputeCharges.toFixed(2),
            monthlyRequestCharges: monthlyRequestCharges.toFixed(2),
            totalCost: (monthlyComputeCharges + monthlyRequestCharges).toFixed(2),
        };
    }
};
