/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { DynamoDBPricing, Pricing } from '../../src/pricing';
import { ProductPricing } from '../../src/types';
import { pricingClient, PricingClient } from '../../src/clients';
import { regions } from '../../src/config';
import * as dynamodbRequestPricing from '../_resources/pricing.dynamodb.requests.json';
import * as dynamodbStoragePricing from '../_resources/pricing.dynamodb.storage.json';
import { DynamoDBDimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Numbers } from '../../src/utils';

const ONE_MILLION = 1000 * 1000;
let dynamodbPricing: DynamoDBPricing;

const requestPricing: ProductPricing[] = [
    {
        version: '20190610172212',
        group: 'DDB-ReadUnits',
        pricePerUnit: 2.83e-7,
        unit: 'ReadRequestUnits',
    },
    {
        version: '20190610172212',
        group: 'DDB-WriteUnits',
        pricePerUnit: 0.0000014135,
        unit: 'WriteRequestUnits',
    },
    {
        version: '20190610172212',
        group: 'DDB-ReplicatedWriteUnits',
        pricePerUnit: 0.0000021202,
        unit: 'ReplicatedWriteRequestUnits',
    },
];

const storagePricing: ProductPricing[] = [{
    version: '20190610172212',
    pricePerUnit: 0.283,
    unit: 'GB-Mo',
}];

describe('DynamodbPricing', () => {
    describe('#instantiation', () => {
        it('is an instance of Pricing Abstract class', () => {
            dynamodbPricing = new DynamoDBPricing();
            expect(dynamodbPricing).toBeInstanceOf(Pricing);
        });
    });

    describe('#init', () => {
        beforeEach(() => {
            this.getProductsStub = jest.fn();
            pricingClient.getProducts = this.getProductsStub;
            dynamodbPricing = new DynamoDBPricing(pricingClient);
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('initializes and correctly sets all pricing parameters', async () => {
            this.getProductsStub.mockResolvedValueOnce(dynamodbRequestPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(dynamodbStoragePricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            await dynamodbPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(2);
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AmazonDynamoDB',
                region: regions.CURRENT_REGION,
                filters: [
                    { field: 'productFamily', value: 'Amazon DynamoDB PayPerRequest Throughput' },
                ],
            });
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AmazonDynamoDB',
                region: regions.CURRENT_REGION,
                filters: [
                    { field: 'productFamily', value: 'Database Storage' },
                    { field: 'volumeType', value: 'Amazon DynamoDB - Indexed DataStore' },
                ],
            });

            expect(dynamodbPricing.readRequestsPrice).toEqual(2.83e-7);
            expect(dynamodbPricing.writeRequestsPrice).toEqual(0.0000014135);
            expect(dynamodbPricing.monthlyStoragePrice).toEqual(0.283);
        });

        it('initializes when it receives a null value on requestPricing', async () => {
            this.getProductsStub.mockResolvedValue(null);
            await dynamodbPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(2);

            expect(dynamodbPricing.readRequestsPrice).toBeUndefined();
            expect(dynamodbPricing.writeRequestsPrice).toBeUndefined();
            expect(dynamodbPricing.monthlyStoragePrice).toBeUndefined();
        });

        it('initializes when it receives a null value on storagePricing', async () => {
            this.getProductsStub.mockResolvedValueOnce(dynamodbRequestPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(null);
            await dynamodbPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(2);

            expect(dynamodbPricing.readRequestsPrice).toEqual(2.83e-7);
            expect(dynamodbPricing.writeRequestsPrice).toEqual(0.0000014135);
            expect(dynamodbPricing.monthlyStoragePrice).toBeUndefined();
        });

        it('initializes when pricing does not contain correct data', async () => {
            this.getProductsStub.mockResolvedValue([]);
            await dynamodbPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(2);
            expect(dynamodbPricing.readRequestsPrice).toBeUndefined();
            expect(dynamodbPricing.writeRequestsPrice).toBeUndefined();
            expect(dynamodbPricing.monthlyStoragePrice).toBeUndefined();
        });
    });

    describe('#calculateForDimension', () => {
        beforeEach(async () => {
            this.end = subMinutes(new Date(), 1);
            this.start = subMinutes(this.end, 1);

            this.getProductsStub = jest.fn();
            this.getProductsStub.mockResolvedValueOnce(requestPricing);
            this.getProductsStub.mockResolvedValueOnce(storagePricing);
            pricingClient.getProducts = this.getProductsStub;
            dynamodbPricing = new DynamoDBPricing(pricingClient);
            await dynamodbPricing.init();
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('calculates correct pricing', async () => {
            const dynamodbDimension = new DynamoDBDimension(buildResource(), this.start, this.end);
            dynamodbDimension.readCapacityUnits = 4;
            dynamodbDimension.writeCapacityUnits = 1;
            dynamodbDimension.storageSizeBytes = 2.5e+10; // 25Gb

            // metrics window = 5s
            const pricingRecord = dynamodbPricing.calculateForDimension(dynamodbDimension);
            expect(Numbers.round(pricingRecord.estimatedMonthlyCharge, 2)).toEqual(7.19);
            expect(Numbers.round(pricingRecord.breakdown.storageCharges, 5)).toEqual(0.00016);
            expect(Numbers.round(pricingRecord.breakdown.writeRequestCharges, 7)).toEqual(0.0000014);
            expect(Numbers.round(pricingRecord.breakdown.readRequestCharges, 7)).toEqual(0.0000011);
            expect(Numbers.round(pricingRecord.totalCost, 5)).toEqual(0.00016);
        });
    });
});
