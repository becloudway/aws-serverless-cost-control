/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { Pricing, RDSPricing } from '../../src/pricing';
import { PricingResult, ProductPricing } from '../../src/types';
import { pricingClient, PricingClient } from '../../src/clients';
import { regions } from '../../src/config';
import * as rdsAcuPricing from '../_resources/pricing.rds.acus.json';
import * as rdsIopsPricing from '../_resources/pricing.rds.iops.json';
import * as rdsStoragePricing from '../_resources/pricing.rds.storage.json';
import { RDSDimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Numbers } from '../../src/util';

const ONE_MILLION = 1000 * 1000;
let rdsPricing: RDSPricing;

const storagePricing: ProductPricing[] = [{
    version: '20190626172522',
    group: undefined,
    pricePerUnit: 0.11,
    unit: 'GB-Mo',
}];

const iopsPricing: ProductPricing[] = [{
    version: '20190626172522',
    group: 'Aurora I/O Operation',
    pricePerUnit: 2.2e-7,
    unit: 'IOs',
}];

const acuPricing: ProductPricing[] = [{
    version: '20190626172522',
    group: undefined,
    pricePerUnit: 0.07,
    unit: 'ACU-Hr',
}];

describe('DynamodbPricing', () => {
    describe('#instantiation', () => {
        it('is an instance of Pricing Abstract class', () => {
            rdsPricing = new RDSPricing();
            expect(rdsPricing).toBeInstanceOf(Pricing);
        });
    });

    describe('#init', () => {
        beforeEach(() => {
            this.getProductsStub = jest.fn();
            pricingClient.getProducts = this.getProductsStub;
            rdsPricing = new RDSPricing(pricingClient);
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('initializes and correctly sets all pricing parameters', async () => {
            this.getProductsStub.mockResolvedValueOnce(rdsAcuPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(rdsIopsPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(rdsStoragePricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            await rdsPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(3);
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AmazonRDS',
                region: regions.CURRENT_REGION,
                filters: [
                    { field: 'productFamily', value: 'serverless' },
                ],
            });
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AmazonRDS',
                region: regions.CURRENT_REGION,
                filters: [
                    { field: 'productFamily', value: 'System Operation' },
                    { field: 'group', value: 'Aurora I/O Operation' },
                    { field: 'databaseEngine', value: 'any' },
                ],
            });
            expect(this.getProductsStub).toHaveBeenCalledWith({
                serviceCode: 'AmazonRDS',
                region: regions.CURRENT_REGION,
                filters: [
                    { field: 'productFamily', value: 'Database Storage' },
                    { field: 'volumeType', value: 'General Purpose-Aurora' },
                    { field: 'databaseEngine', value: 'any' },
                ],
            });

            expect(rdsPricing.hourlyACUPrice).toEqual(0.07);
            expect(rdsPricing.iopsPrice).toEqual(0.00000022);
            expect(rdsPricing.monthlyStoragePrice).toEqual(0.11);
        });

        it('initializes when it receives a null value on requestPricing', async () => {
            this.getProductsStub.mockResolvedValue(null);
            await rdsPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(3);

            expect(rdsPricing.monthlyStoragePrice).toBeUndefined();
            expect(rdsPricing.hourlyACUPrice).toBeUndefined();
            expect(rdsPricing.iopsPrice).toBeUndefined();
        });

        it('initializes when it receives a null value on storagePricing', async () => {
            this.getProductsStub.mockResolvedValueOnce(rdsAcuPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(rdsIopsPricing.map(p => PricingClient.buildProductsFromPriceList(p)));
            this.getProductsStub.mockResolvedValueOnce(null);
            await rdsPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(3);

            expect(rdsPricing.hourlyACUPrice).toEqual(0.07);
            expect(rdsPricing.iopsPrice).toEqual(0.00000022);
            expect(rdsPricing.monthlyStoragePrice).toBeUndefined();
        });

        it('initializes when pricing does not contain correct data', async () => {
            this.getProductsStub.mockResolvedValue([]);
            await rdsPricing.init();

            expect(this.getProductsStub).toHaveBeenCalledTimes(3);
            expect(rdsPricing.monthlyStoragePrice).toBeUndefined();
            expect(rdsPricing.hourlyACUPrice).toBeUndefined();
            expect(rdsPricing.iopsPrice).toBeUndefined();
        });
    });

    describe('#calculateForDimension', () => {
        beforeEach(async () => {
            this.end = subMinutes(new Date(), 1);
            this.start = subMinutes(this.end, 1);

            this.getProductsStub = jest.fn();
            this.getProductsStub.mockResolvedValueOnce(acuPricing);
            this.getProductsStub.mockResolvedValueOnce(iopsPricing);
            this.getProductsStub.mockResolvedValueOnce(storagePricing);
            pricingClient.getProducts = this.getProductsStub;
            rdsPricing = new RDSPricing(pricingClient);
            await rdsPricing.init();
        });

        afterEach(() => jest.resetAllMocks());
        afterAll(() => jest.restoreAllMocks());

        it('calculates correct pricing', async () => {
            const rdsDimension = new RDSDimension(buildResource(), this.start, this.end);
            rdsDimension.auroraCapacityUnits = 4;
            rdsDimension.ioRequests = 65;
            rdsDimension.storedGiBs = 80;

            // metrics window = 5s
            const pricingRecord = rdsPricing.calculateForDimension(rdsDimension);
            expect(Numbers.round(pricingRecord.estimatedMonthlyCharge, 2)).toEqual(213.33);
            expect(Numbers.round(pricingRecord.breakdown.storageCharges, 4)).toEqual(0.0002);
            expect(pricingRecord.breakdown.iopsCharges).toEqual(1.43e-11);
            expect(Numbers.round(pricingRecord.breakdown.ACUCharges, 4)).toEqual(0.0047);
            expect(Numbers.round(pricingRecord.totalCost, 4)).toEqual(0.0049);
        });
    });
});
