/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { LambdaDimension } from '../src/dimension';
import { LambdaPricing } from '../src/pricing';
import { PricingResult, ProductPricing } from '../src/types';
import { Resource } from '../src/resource';
import { PricingClient } from '../src/clients';

const ONE_MILLION = 1000 * 1000;
const pricing: ProductPricing[] = [
    {
        version: '20181212011734',
        group: 'AWS-Lambda-Requests',
        pricePerUnit: 0.0000002,
        unit: 'Requests',
    },
    {
        version: '20181212011734',
        group: 'AWS-Lambda-Duration',
        pricePerUnit: 0.0000166667,
        unit: 'Second',
    },
];


describe('lambda price calculator', () => {
    beforeEach(async () => {
        this.end = subMinutes(new Date(), 1);
        this.start = subMinutes(this.end, 1);
        const getProductsMock = jest.fn();
        getProductsMock.mockReturnValue(pricing);

        const pricingClient = new PricingClient({});
        pricingClient.getProducts = getProductsMock;
        this.lambdaPricing = new LambdaPricing(pricingClient);
        await this.lambdaPricing.init();

        this.lambdaFunction = new Resource('lambda', 'lambda-resource-id');
    });

    afterEach(() => jest.resetAllMocks());

    it('calculates correct pricing #1', async () => {
        const lambdaDimension = new LambdaDimension(this.lambdaFunction, this.start, this.end);
        lambdaDimension.averageDuration = 1000;
        lambdaDimension.requestCount = 3 * ONE_MILLION;
        lambdaDimension.memory = 512;

        // metrics window = 5s
        const pricingRecord = this.lambdaPricing.calculateForDimension(lambdaDimension);
        expect(pricingRecord.breakdown.computeCharges).toEqual(25);
        expect(pricingRecord.breakdown.requestCharges).toEqual(0.6);
        expect(pricingRecord.totalCost).toEqual(25.6);
    });
    it('calculates correct pricing #2', () => {
        const lambdaDimension = new LambdaDimension(this.lambdaFunction, this.start, this.end);
        lambdaDimension.averageDuration = 200;
        lambdaDimension.requestCount = 30 * ONE_MILLION;
        lambdaDimension.memory = 128;

        const pricingRecord = this.lambdaPricing.calculateForDimension(lambdaDimension);
        expect(pricingRecord.breakdown.computeCharges).toEqual(12.5);
        expect(pricingRecord.breakdown.requestCharges).toEqual(6);
        expect(pricingRecord.totalCost).toEqual(18.5);
    });
    it('calculates correct pricing for multiple lambdas', () => {
        const lambdaDimension1 = new LambdaDimension(this.lambdaFunction, this.start, this.end);
        lambdaDimension1.averageDuration = 200;
        lambdaDimension1.requestCount = 25 * ONE_MILLION;
        lambdaDimension1.memory = 128;
        const lambdaDimension2 = new LambdaDimension(this.lambdaFunction, this.start, this.end);
        lambdaDimension2.averageDuration = 500;
        lambdaDimension2.requestCount = 5 * ONE_MILLION;
        lambdaDimension2.memory = 448;
        const lambdaDimension3 = new LambdaDimension(this.lambdaFunction, this.start, this.end);
        lambdaDimension3.averageDuration = 1000;
        lambdaDimension3.requestCount = 2.5 * ONE_MILLION;
        lambdaDimension3.memory = 1024;

        const pricingRecord = this.lambdaPricing.calculate([lambdaDimension1, lambdaDimension2, lambdaDimension3]);
        expect(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.breakdown.computeCharges + acc, 0)).toEqual(70.32);
        expect(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.breakdown.requestCharges + acc, 0)).toEqual(6.50);
        expect(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.totalCost + acc, 0)).toEqual(76.82);
    });
});
