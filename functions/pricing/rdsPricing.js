const { differenceInSeconds } = require('date-fns');
const PricingAbstract = require('./PricingAbstract');
const config = require('../config');

module.exports = class RdsPricing extends PricingAbstract {
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
        const storageCost = (dimension.storedGiBs * this.monthlyStoragePrice) / (10 ** 9) / config.window.MONTHLY / 60; // cost per minute
        const iopsCost = dimension.ioRequests * this.iopsPrice / config.metrics.METRIC_WINDOW;
        const totalCost = ACUCost + storageCost + iopsCost;
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / config.metrics.METRIC_WINDOW;

        return {
            region: this.region,
            currency: this.currency,
            resourceId: dimension.resource.id,
            estimatedMonthlyCharge: RdsPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: {
                storageCharges: storageCost,
                iopsCharges: iopsCost,
                ACUCharges: ACUCost,
            },
        };
    }
};
