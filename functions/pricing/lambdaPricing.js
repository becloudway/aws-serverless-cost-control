const { max } = require('date-fns');

const CURRENCY = 'USD';
const THOUSAND = 1000;
const ONE_MILLION = 1000 * 1000;
const FREE_TIER_COMPUTE_ALLOWANCE = 400 * THOUSAND;
const FREE_TIER_REQUEST_ALLOWANCE = ONE_MILLION;

module.exports = class LambdaPricing {
    constructor({
        region,
        requestCount,
        averageDuration,
        memory,
        dataTransferOutInternetGb,
        dataTransferOutIntraRegionGb,
        dataTransferOutInterRegionGb,
        toRegion,
    }) {
        this.region = region;
        this.requestCount = requestCount;
        this.averageDuration = averageDuration;
        this.memory = memory;
        this.dataTransferOutInternetGb = dataTransferOutInternetGb;
        this.dataTransferOutIntraRegionGb = dataTransferOutIntraRegionGb;
        this.dataTransferOutInterRegionGb = dataTransferOutInterRegionGb;
        this.toRegion = toRegion;
    }

    calculate(pricing) {
        const monthlyComputePrice = pricing.find(p => p.unit === 'Second').pricePerUnit;
        const monthlyRequestPrice = pricing.find(p => p.unit === 'Requests').pricePerUnit;
        const totalComputeSeconds = this.requestCount * this.averageDuration;
        const totalComputeGBs = (totalComputeSeconds * this.memory) / 1024;
        const billableComputeGBs = max(totalComputeGBs - FREE_TIER_COMPUTE_ALLOWANCE, 0);
        const monthlyComputeCharges = billableComputeGBs * monthlyComputePrice;

        const billableRequests = max(this.requestCount - FREE_TIER_REQUEST_ALLOWANCE, 0);
        const monthlyRequestCharges = (billableRequests * monthlyRequestPrice) / ONE_MILLION;

        return {
            region: this.region,
            currency: CURRENCY,
            monthlyComputeCharges: Math.round(monthlyComputeCharges, 2),
            monthlyRequestCharges: Math.round(monthlyRequestCharges, 2),
            totalCost: Math.round(monthlyComputeCharges + monthlyRequestCharges, 2),
        };
    }
};
