/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { CostRecord } from '../../src/pricing';
import { buildResource } from '../_helpers/builders';
import { SERVICE_DYNAMODB, SERVICE_LAMBDA, SERVICE_RDS } from '../../src/config';
import { Resource } from '../../src/resource';
import { PricingResult } from '../../src/types';

const { LambdaDimension } = jest.genMockFromModule('../../src/dimension/LambdaDimension');
const { DynamoDBDimension } = jest.genMockFromModule('../../src/dimension/DynamoDBDimension');
const { RDSDimension } = jest.genMockFromModule('../../src/dimension/RDSDimension');
const { LambdaPricing } = jest.genMockFromModule('../../src/pricing/LambdaPricing');
const { DynamoDBPricing } = jest.genMockFromModule('../../src/pricing/DynamoDBPricing');
const { RDSPricing } = jest.genMockFromModule('../../src/pricing/RDSPricing');

let costRecord: CostRecord;
let resource: Resource;

jest.mock('../../src/logger');

describe('CostRecord', () => {
    beforeAll(async () => {
        LambdaDimension.prototype.create = jest.fn(function () { return this; });
        LambdaPricing.prototype.init = jest.fn(function () { return this; });
        LambdaPricing.prototype.calculateForDimension = jest.fn(() => 'pricingResult');


        this.end = subMinutes(new Date(), 1);
        this.start = subMinutes(this.end, 1);
        resource = buildResource({ service: SERVICE_LAMBDA });

        costRecord = new CostRecord(resource, LambdaPricing, LambdaDimension);
        await costRecord.fetch({ start: this.start, end: this.end });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('#instantiation', () => {
        it('instantiates with resource parameter', () => {
            expect(new CostRecord(resource)).toBeInstanceOf(CostRecord);
        });
        it('instantiates with resource and Pricing parameter', () => {
            expect(new CostRecord(resource, LambdaPricing)).toBeInstanceOf(CostRecord);
        });
        it('instantiates with resource, Pricing and Dimension parameter', () => {
            expect(new CostRecord(resource, LambdaPricing)).toBeInstanceOf(CostRecord);
        });
    });

    it('#fetch: fetches a costrecord for a resource dimension and pricing object', async () => {
        expect(LambdaDimension).toHaveBeenCalledTimes(1);
        expect(LambdaDimension).toHaveBeenCalledWith(resource, this.start, this.end);
        expect(LambdaDimension.prototype.create).toHaveBeenCalledTimes(1);

        expect(LambdaPricing).toHaveBeenCalledTimes(1);
        expect(LambdaPricing.prototype.init).toHaveBeenCalledTimes(1);
        expect(LambdaPricing.prototype.calculateForDimension).toHaveBeenCalledTimes(1);
        expect(LambdaPricing.prototype.calculateForDimension).toBeCalledWith(expect.any(LambdaDimension));
    });

    it('#resource: accessor for resource', () => {
        expect(costRecord.resource).toBeInstanceOf(Resource);
        expect(costRecord.resource.service).toEqual(SERVICE_LAMBDA);
    });

    it('#pricing: accessor for pricing exposes result of pricing.calculateForDimension', () => {
        expect(costRecord.pricing).toEqual('pricingResult');
        expect(costRecord.resource.service).toEqual(SERVICE_LAMBDA);
    });
});
