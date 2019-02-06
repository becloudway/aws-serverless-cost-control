/* eslint-disable class-methods-use-this */
const config = require('../config');
const { PRICING } = require('../clients');

const getForecastFactor = (diffInSeconds) => {
    return (3600 / diffInSeconds) * config.window.MONTHLY;
};

module.exports = class PricingAbstract {
    constructor() {
        this.pricingClient = PRICING;
        this.region = config.regions.CURRENT_REGION;
        this.currency = 'USD';
    }

    static getMonthlyEstimate(cost, diffInSeconds) {
        return Math.round(cost * getForecastFactor(diffInSeconds) * 100) / 100;
    }

    async init() {
        throw new Error('Pricing.init must be implemented');
    }

    async calculateForDimension() {
        throw new Error('Pricing.calculateForResource must be implemented');
    }

    calculate(resourceDimensions) {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }
};
