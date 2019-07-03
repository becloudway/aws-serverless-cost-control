/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { LambdaPricing, Pricing } from '../../src/pricing';
import { LambdaDimension } from '../../src/dimension';
import { PricingResult, ProductPricing } from '../../src/types';
import { pricingClient, PricingClient } from '../../src/clients';
import { regions } from '../../src/config';
import * as pricingLambdaJson from '../_resources/pricing.lambda.json';
import { buildResource } from '../_helpers/builders';
import { Numbers } from '../../src/util';

const ONE_MILLION = 1000 * 1000;
let lambdaPricing: LambdaPricing;

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

jest.mock('../../src/logger');

describe('LambdaPricing', () => {
    describe('#instantiation', () => {
        it('is an instance of Pricing Abstract class', () => {
            lambdaPricing = new LambdaPricing();
            expect(lambdaPricing).toBeInstanceOf(Pricing);
        });
    });

    describe('#init', () => {
        beforeEach(() => {
            this.getProductsStub = jest.fn();
            pricingClient.getProducts = this.getProductsStub;
            lambdaPricing = new LambdaPricing(pricingClient);
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('initializes and correctly sets pricing parameters', async () => {
            this.getProductsStub.mockResolvedValue(pricingLambdaJson.map(p => PricingClient.buildProductsFromPriceList(p)));
            await lambdaPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(1);
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AWSLambda',
                region: regions.CURRENT_REGION,
            });
            expect(lambdaPricing.pricing.length).toEqual(2);
            expect(lambdaPricing.computePrice).toEqual(0.0000166667);
            expect(lambdaPricing.requestPrice).toEqual(2e-7);
        });

        it('initializes when it receives a null value on pricing', async () => {
            this.getProductsStub.mockResolvedValue(null);
            await lambdaPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(1);
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AWSLambda',
                region: regions.CURRENT_REGION,
            });
            expect(lambdaPricing.pricing.length).toEqual(0);
        });

        it('initializes when pricing does not contain correct data', async () => {
            this.getProductsStub.mockResolvedValue([]);
            await lambdaPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(1);
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AWSLambda',
                region: regions.CURRENT_REGION,
            });
            expect(lambdaPricing.pricing.length).toEqual(0);
        });
    });

    describe('#calculateForDimension', () => {
        beforeEach(async () => {
            this.end = subMinutes(new Date(), 1);
            this.start = subMinutes(this.end, 1);

            this.getProductsStub = jest.fn();
            this.getProductsStub.mockResolvedValue(pricing);
            pricingClient.getProducts = this.getProductsStub;
            lambdaPricing = new LambdaPricing(pricingClient);
            await lambdaPricing.init();
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('calculates correct pricing #1', async () => {
            const lambdaDimension = new LambdaDimension(buildResource(), this.start, this.end);
            lambdaDimension.averageDuration = 1000;
            lambdaDimension.requestCount = 3 * ONE_MILLION;
            lambdaDimension.memory = 512;

            // metrics window = 5s
            const pricingRecord = lambdaPricing.calculateForDimension(lambdaDimension);
            expect(Numbers.round(pricingRecord.breakdown.computeCharges, 2)).toEqual(25);
            expect(Numbers.round(pricingRecord.breakdown.requestCharges, 2)).toEqual(0.6);
            expect(Numbers.round(pricingRecord.totalCost, 2)).toEqual(25.6);
        });
        it('calculates correct pricing #2', () => {
            const lambdaDimension = new LambdaDimension(buildResource(), this.start, this.end);
            lambdaDimension.averageDuration = 200;
            lambdaDimension.requestCount = 30 * ONE_MILLION;
            lambdaDimension.memory = 128;

            const pricingRecord = lambdaPricing.calculateForDimension(lambdaDimension);
            expect(Numbers.round(pricingRecord.breakdown.computeCharges, 2)).toEqual(12.5);
            expect(Numbers.round(pricingRecord.breakdown.requestCharges, 2)).toEqual(6);
            expect(Numbers.round(pricingRecord.totalCost, 2)).toEqual(18.5);
        });

        it('calculates correct pricing for multiple lambdas', () => {
            const lambdaDimension1 = new LambdaDimension(buildResource(), this.start, this.end);
            lambdaDimension1.averageDuration = 200;
            lambdaDimension1.requestCount = 25 * ONE_MILLION;
            lambdaDimension1.memory = 128;
            const lambdaDimension2 = new LambdaDimension(buildResource(), this.start, this.end);
            lambdaDimension2.averageDuration = 500;
            lambdaDimension2.requestCount = 5 * ONE_MILLION;
            lambdaDimension2.memory = 448;
            const lambdaDimension3 = new LambdaDimension(buildResource(), this.start, this.end);
            lambdaDimension3.averageDuration = 1000;
            lambdaDimension3.requestCount = 2.5 * ONE_MILLION;
            lambdaDimension3.memory = 1024;

            const pricingRecord = lambdaPricing.calculate([lambdaDimension1, lambdaDimension2, lambdaDimension3]);
            expect(Numbers.round(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.breakdown.computeCharges + acc, 0), 2)).toEqual(70.31);
            expect(Numbers.round(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.breakdown.requestCharges + acc, 0), 2)).toEqual(6.50);
            expect(Numbers.round(pricingRecord.reduce((acc: number, curVal: PricingResult) => curVal.totalCost + acc, 0), 2)).toEqual(76.81);
        });
    });
});
