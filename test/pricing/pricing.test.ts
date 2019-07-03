/* eslint-disable no-undef */

import * as faker from 'faker';

import { Pricing } from '../../src/pricing';
import { Dimension } from '../../src/dimension';
import { PricingResult } from '../../src/types';
import { pricingClient, PricingClient } from '../../src/clients';
import { regions } from '../../src/config';
import { buildResource } from '../_helpers/builders';

class PricingImplement extends Pricing {
    // eslint-disable-next-line class-methods-use-this
    public calculateForDimension(dimension: Dimension): PricingResult {
        return null;
    }

    public async init(): Promise<Pricing> {
        return Promise.resolve(this);
    }

    public getPricingClient(): PricingClient {
        return this.pricingClient;
    }

    public getRegion(): string {
        return this.region;
    }

    public getCurrency(): string {
        return this.currency;
    }
}

class DimensionImplement extends Dimension {
    public async create(): Promise<Dimension> {
        return Promise.resolve(this);
    }
}

describe('#Pricing.AbstractClass', () => {
    let pricing: PricingImplement;

    describe('#static.getMonthlyEstimate', () => {
        it('correctly provides a monthly estimate for a cost', () => {
            const estimate = Pricing.getMonthlyEstimate(1, 3600);
            expect(Pricing.getMonthlyEstimate(1, 3600)).toEqual(730.48);
        });
    });

    describe('#instantiation', () => {
        it('with a custom pricingClient', () => {
            pricing = new PricingImplement(pricingClient);
            expect(pricing).toBeInstanceOf(Pricing);
            expect(pricing.getPricingClient()).toBeInstanceOf(PricingClient);
        });

        it('with a default pricingClient', () => {
            pricing = new PricingImplement();
            expect(pricing).toBeInstanceOf(Pricing);
            expect(pricing.getPricingClient()).toBeInstanceOf(PricingClient);
        });

        it('has a abstract method "init"', () => {
            pricing = new PricingImplement();
            expect(pricing.init).toBeInstanceOf(Function);
        });

        it('has a abstract method "calculateForDimension"', () => {
            pricing = new PricingImplement();
            expect(pricing.calculateForDimension).toBeInstanceOf(Function);
        });
    });

    describe('#attributes', () => {
        beforeEach(() => {
            pricing = new PricingImplement();
        });

        it('has a default region', () => {
            expect(pricing.getRegion()).toEqual(regions.CURRENT_REGION);
        });

        it('has a default currency', () => {
            expect(pricing.getCurrency()).toEqual('USD');
        });

        it('has a default pricingClient', () => {
            expect(pricing.getPricingClient()).toBeInstanceOf(PricingClient);
        });
    });

    describe('#calculate', () => {
        it('executes calculateForDimension for each dimension and returns array of priceResults', async () => {
            const calculateForDimensionStub = jest.fn().mockReturnValue({
                currency: this.currency,
                estimatedMonthlyCharge: faker.random.number(),
                totalCostWindowSeconds: faker.random.number(),
                totalCost: faker.random.number(),
                breakdown: 'some stuff',
            });
            pricing = new PricingImplement();
            pricing.calculateForDimension = calculateForDimensionStub;

            const d1 = new DimensionImplement(buildResource(), faker.date.past(), faker.date.recent());
            const d2 = new DimensionImplement(buildResource(), faker.date.past(), faker.date.recent());
            const pricinResults: PricingResult[] = await pricing.calculate([d1, d2]);

            expect(calculateForDimensionStub).toHaveBeenCalledTimes(2);
            expect(calculateForDimensionStub).toHaveBeenCalledWith(d1);
            expect(calculateForDimensionStub).toHaveBeenCalledWith(d2);
        });
    });
});
