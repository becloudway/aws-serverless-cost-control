import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Pricing } from './Pricing';
import { DynamoDBDimension } from '../dimension';
import { PricingResult } from '../types';

export class DynamoDBPricing extends Pricing {
    private writeRequestsPrice: number;

    private readRequestsPrice: number;

    private monthlyStoragePrice: number;

    private requestsPerReadWriteUnit: number;

    public async init(): Promise<DynamoDBPricing> {
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

    public calculateForDimension(dimension: DynamoDBDimension): PricingResult {
        // by default, cost window is one minute and metric window 5 minutes
        const metricWindowMinutes = differenceInMinutes(dimension.end, dimension.start);
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / metricWindowMinutes;

        const writeCostPerMinute = dimension.writeCapacityUnits * (this.writeRequestsPrice / this.requestsPerReadWriteUnit) / metricWindowMinutes;
        const readCostPerMinute = dimension.readCapacityUnits * (this.readRequestsPrice / this.requestsPerReadWriteUnit) / metricWindowMinutes;
        const storageCost = (dimension.storageSizeBytes / (10 ** 9)) * this.monthlyStoragePrice / metricWindowMinutes / 60;
        const totalCost = writeCostPerMinute + readCostPerMinute + storageCost;

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
