"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require('../config');
const { PRICING } = require('../clients');
const getForecastFactor = (diffInSeconds) => {
    return (3600 / diffInSeconds) * config.window.MONTHLY;
};
class Pricing {
    constructor() {
        this.pricingClient = PRICING;
        this.region = config.regions.CURRENT_REGION;
        this.currency = 'USD';
    }
    static getMonthlyEstimate(cost, diffInSeconds) {
        return Math.round(cost * getForecastFactor(diffInSeconds) * 100) / 100;
    }
    calculate(resourceDimensions) {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }
}
exports.Pricing = Pricing;
;
//# sourceMappingURL=PricingAbstract.js.map