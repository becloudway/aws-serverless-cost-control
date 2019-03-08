"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const Pricing_1 = require("./Pricing");
const config_1 = require("../config");
class RDSPricing extends Pricing_1.Pricing {
    async init() {
        const acuPricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'serverless' },
            ],
        });
        const iopsPricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'System Operation' },
                { field: 'group', value: 'Aurora I/O Operation' },
                { field: 'databaseEngine', value: 'any' },
            ],
        });
        const storagePricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'Database Storage' },
                { field: 'volumeType', value: 'General Purpose-Aurora' },
                { field: 'databaseEngine', value: 'any' },
            ],
        });
        this.monthlyStoragePrice = storagePricing[0] && storagePricing[0].pricePerUnit;
        this.hourlyACUPrice = acuPricing[0] && acuPricing[0].pricePerUnit;
        this.iopsPrice = iopsPricing[0] && iopsPricing[0].pricePerUnit;
        return this;
    }
    calculateForDimension(dimension) {
        const ACUCost = (dimension.auroraCapacityUnits * this.hourlyACUPrice) / 60; // cost per minute
        const storageCost = (dimension.storedGiBs * this.monthlyStoragePrice) / (10 ** 9) / config_1.window.MONTHLY / 60; // cost per minute
        const iopsCost = dimension.ioRequests * this.iopsPrice / config_1.metrics.METRIC_WINDOW;
        const totalCost = ACUCost + storageCost + iopsCost;
        const costWindowSeconds = date_fns_1.differenceInSeconds(dimension.end, dimension.start) / config_1.metrics.METRIC_WINDOW;
        return {
            currency: this.currency,
            estimatedMonthlyCharge: RDSPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: {
                storageCharges: storageCost,
                iopsCharges: iopsCost,
                ACUCharges: ACUCost,
            },
        };
    }
}
exports.RDSPricing = RDSPricing;
//# sourceMappingURL=rdsPricing.js.map