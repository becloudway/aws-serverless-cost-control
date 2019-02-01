const config = require('../config');
const { PRICING } = require('../clients');

const CURRENCY = 'USD';

module.exports = class LambdaPricing {
    constructor() {
        this.region = config.regions.CURRENT_REGION;
    }

    async init() {
        const acuPricing = await PRICING.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'serverless' },
            ],
        });

        const iopsPricing = await PRICING.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'System Operation' },
                { field: 'group', value: 'Aurora I/O Operation' },
                { field: 'databaseEngine', value: 'any' },
            ],
        });

        const storagePricing = await PRICING.getProducts({
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
    }

    calculateForInstance(dimension) {
        const ACUCost = (dimension.auroraCapacityUnits * this.hourlyACUPrice) / 60
        const storageCost = (dimension.storedGiBs * this.monthlyStoragePrice) / (10 ** 9) / config.window.MONTHLY / 60;
        const iopsCost = dimension.ioRequests * this.iopsPrice;

        return {
            region: this.region,
            currency: CURRENCY,
            resourceId: dimension.cluster.id,
            totalCost: ACUCost + storageCost + iopsCost,
            breakdown: {
                storageCharges: storageCost,
                iopsCharges: iopsCost,
                ACUCharges: ACUCost,
            },
        };
    }

    calculate(rdsDimensions) {
        return rdsDimensions.map(d => this.calculateForInstance(d));
    }
};
