/* eslint-disable no-undef,object-curly-newline */
import * as AWS from 'aws-sdk';
import * as faker from 'faker';
import { GetProductsRequest } from 'aws-sdk/clients/pricing';
import { CloudwatchClient, DynamoDBClient, PricingClient } from '../../src/clients';
import { regions } from '../../src/config';
import { buildRange, buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';
import { DateRange, ProductPricing } from '../../src/types';
import * as lambdaPricing from '../_resources/pricing.lambda.json';

describe('PricingClient', () => {
    const awsPricing = new AWS.Pricing({ apiVersion: '2017-10-15', region: regions.NORTH_VIRGINIA });
    const client: PricingClient = new PricingClient(awsPricing);
    const resource: Resource = buildResource();
    const range: DateRange = buildRange();

    beforeAll(() => {
        this.getProductsMock = jest.fn();
        awsPricing.getProducts = this.getProductsMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#getProducts', () => {
        const serviceCode = faker.lorem.word();
        const region = regions.CURRENT_REGION;
        const filter = { field: faker.lorem.word(), value: faker.lorem.word() };
        const output: ProductPricing[] = [
            { version: '20190424183113', group: 'AWS-Lambda-Requests', pricePerUnit: 2e-7, unit: 'Requests' },
            { version: '20190424183113', group: 'AWS-Lambda-Edge-Requests', pricePerUnit: 6e-7, unit: 'Request' },
            { version: '20190424183113', group: 'AWS-Lambda-Duration', pricePerUnit: 0.0000166667, unit: 'Second' },
            { version: '20190424183113', group: 'AWS-Lambda-Edge-Duration', pricePerUnit: 0.00005001, unit: 'Lambda-GB-Second' },
        ];
        const input: GetProductsRequest = {
            ServiceCode: serviceCode,
            Filters: [
                { Field: filter.field, Type: 'TERM_MATCH', Value: filter.value },
                { Field: 'location', Type: 'TERM_MATCH', Value: regions.NAME[region] },
                { Field: 'termType', Type: 'TERM_MATCH', Value: 'OnDemand' },
            ],
        };

        it('fetches a list of products', async () => {
            this.getProductsMock.mockImplementation((data: any, callback: Function) => callback(null, { PriceList: lambdaPricing }));

            await expect(client.getProducts({ serviceCode, filters: [filter], region })).resolves.toEqual(output);
            expect(awsPricing.getProducts).toHaveBeenCalledTimes(1);
            expect(awsPricing.getProducts).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('has an optional filters option', async () => {
            const mockInput = JSON.parse(JSON.stringify(input));
            mockInput.Filters = mockInput.Filters.slice(1);
            this.getProductsMock.mockImplementation((data: any, callback: Function) => callback(null, { PriceList: lambdaPricing }));

            await expect(client.getProducts({ serviceCode, region })).resolves.toEqual(output);
            expect(awsPricing.getProducts).toHaveBeenCalledTimes(1);
            expect(awsPricing.getProducts).toHaveBeenCalledWith(mockInput, expect.any(Function));
        });

        it('only accepts USD as price per unit, otherwise sets 0 as pricePerUnit', async () => {
            const mockPricelist = JSON.parse(JSON.stringify(lambdaPricing).replace('USD', 'EUR'));
            const mockOutput = JSON.parse(JSON.stringify(output));
            mockOutput[0].pricePerUnit = 0;
            this.getProductsMock.mockImplementation((data: any, callback: Function) => callback(null, { PriceList: mockPricelist }));

            await expect(client.getProducts({ serviceCode, filters: [filter], region })).resolves.toEqual(mockOutput);
            expect(awsPricing.getProducts).toHaveBeenCalledTimes(1);
            expect(awsPricing.getProducts).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('fetches a list of products which is empty', async () => {
            this.getProductsMock.mockImplementation((data: any, callback: Function) => callback(null, null));

            await expect(client.getProducts({ serviceCode, filters: [filter], region })).resolves.toEqual([]);
            expect(awsPricing.getProducts).toHaveBeenCalledTimes(1);
            expect(awsPricing.getProducts).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('fetches a list of products and filters out where pricelist item fails to parse', async () => {
            const mockPricelist = lambdaPricing.map(i => Object.assign({}, i));
            const mockOutput = output.slice(1);
            delete mockPricelist[0].terms;
            this.getProductsMock.mockImplementation((data: any, callback: Function) => callback(null, { PriceList: mockPricelist }));

            await expect(client.getProducts({ serviceCode, filters: [filter], region })).resolves.toEqual(mockOutput);
            expect(awsPricing.getProducts).toHaveBeenCalledTimes(1);
            expect(awsPricing.getProducts).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
});
