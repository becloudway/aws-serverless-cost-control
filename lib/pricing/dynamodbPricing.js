"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const Pricing_1 = require("./Pricing");
const config_1 = require("../config");
class DynamoDBPricing extends Pricing_1.Pricing {
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
        const writeCostPerMinute = dimension.writeCapacityUnits * (this.writeRequestsPrice / this.requestsPerReadWriteUnit) / config_1.metrics.METRIC_WINDOW;
        const readCostPerMinute = dimension.readCapacityUnits * (this.readRequestsPrice / this.requestsPerReadWriteUnit) / config_1.metrics.METRIC_WINDOW;
        const storageCost = (dimension.storageSizeBytes / (10 ** 9)) * this.monthlyStoragePrice / config_1.window.MONTHLY / 60;
        const totalCost = writeCostPerMinute + readCostPerMinute + storageCost;
        const costWindowSeconds = date_fns_1.differenceInSeconds(dimension.end, dimension.start) / config_1.metrics.METRIC_WINDOW;
        return {
            currency: this.currency,
            estimatedMonthlyCharge: DynamoDBPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: {
                storageCharges: storageCost,
                writeRequestCharges: writeCostPerMinute,
                readRequestCharges: readCostPerMinute,
            },
        };
    }
}
exports.DynamoDBPricing = DynamoDBPricing;
//# sourceMappingURL=dynamodbPricing.js.map