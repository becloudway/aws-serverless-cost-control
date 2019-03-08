"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const clients_1 = require("../clients");
class Pricing {
    constructor() {
        this.pricingClient = clients_1.pricingClient;
        this.region = config_1.regions.CURRENT_REGION;
        this.currency = 'USD';
    }
    static getMonthlyEstimate(cost, diffInSeconds) {
        const getForecastFactor = (diff) => (3600 / diff) * config_1.window.MONTHLY;
        return Math.round(cost * getForecastFactor(diffInSeconds) * 100) / 100;
    }
    calculate(resourceDimensions) {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }
}
exports.Pricing = Pricing;
//# sourceMappingURL=Pricing.js.map