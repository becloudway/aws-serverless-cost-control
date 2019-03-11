import { PricingResult } from '../types';
import { regions, window } from '../config';
import { Dimension } from '../dimension';
import { PricingClient, pricingClient } from '../clients';
import { round } from '../util';

export abstract class Pricing {
    protected pricingClient: PricingClient = pricingClient;

    protected region: string = regions.CURRENT_REGION;

    protected currency: string = 'USD';

    abstract async init(): Promise<Pricing>;

    abstract calculateForDimension(dimension: Dimension): PricingResult;

    public constructor(injectedClient?: PricingClient) {
        if (injectedClient instanceof PricingClient) {
            this.pricingClient = injectedClient;
        }
    }

    public static getMonthlyEstimate(cost: number, diffInSeconds: number): number {
        const getForecastFactor = (diff: number): number => (3600 / diff) * window.MONTHLY;
        return round(cost * getForecastFactor(diffInSeconds), 2);
    }

    public calculate(resourceDimensions: Dimension[]): PricingResult[] {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }
}
