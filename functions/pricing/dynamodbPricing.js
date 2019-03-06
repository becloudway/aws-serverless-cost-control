const { differenceInSeconds } = require('date-fns');
const PricingAbstract = require('./PricingAbstract');
const config = require('../config');

module.exports = class DynamodbPricing extends PricingAbstract {
    async init() {
        const requestPricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonDynamoDB',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'Amazon DynamoDB PayPerRequest Throughput' },
            ],
        });
        const storagePricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonDynamoDB',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'Database Storage' },
                { field: 'volumeType', value: 'Amazon DynamoDB - Indexed DataStore' },
            ],
        });

        this.requestsPerReadWriteUnit = 10 ** 9;


        this.writeRequestsPrice = requestPricing.find(p => p.unit === 'WriteRequestUnits').pricePerUnit;
        this.readRequestsPrice = requestPricing.find(p => p.unit === 'ReadRequestUnits').pricePerUnit;
        this.monthlyStoragePrice = storagePricing.find(p => p.unit === 'GB-Mo').pricePerUnit;

        return this;
    }

    calculateForDimension(dimension) {
        const writeCostPerMinute = dimension.writeCapacityUnits * (this.writeRequestsPrice / this.requestsPerReadWriteUnit) / config.metrics.METRIC_WINDOW;
        const readCostPerMinute = dimension.readCapacityUnits * (this.readRequestsPrice / this.requestsPerReadWriteUnit) / config.metrics.METRIC_WINDOW;
        const storageCost = (dimension.storageSizeBytes / (10 ** 9)) * this.monthlyStoragePrice / config.window.MONTHLY / 60;
        const totalCost = writeCostPerMinute + readCostPerMinute + storageCost;
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / config.metrics.METRIC_WINDOW;

        return {
            // region: this.region,
            currency: this.currency,
            // resourceId: dimension.resource.id,
            estimatedMonthlyCharge: DynamodbPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: {
                storageCharges: storageCost,
                writeRequestCharges: writeCostPerMinute,
                readRequestCharges: readCostPerMinute,
            },
        };
    }
};
