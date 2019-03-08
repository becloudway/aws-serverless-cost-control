import { PricingResult } from '../types';
import { regions, window } from '../config';
import { Dimension } from '../dimension';
import { PricingClient, pricingClient } from '../clients';

export abstract class Pricing {
    protected pricingClient: PricingClient = pricingClient;

    protected region: string = regions.CURRENT_REGION;

    protected currency: string = 'USD';

    abstract async init(): Promise<Pricing>;

    abstract calculateForDimension(dimension: Dimension): PricingResult;

    public static getMonthlyEstimate(cost: number, diffInSeconds: number): number {
        const getForecastFactor = (diff: number): number => (3600 / diff) * window.MONTHLY;
        return Math.round(cost * getForecastFactor(diffInSeconds) * 100) / 100;
    }

    public calculate(resourceDimensions: Dimension[]): PricingResult[] {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }
}
