import { PricingResult, ProductPricing } from '../types';
import { regions, window } from '../config';
import { Dimension } from '../dimension';
import { PricingClient, pricingClient } from '../clients';
import { Numbers } from '../util';

export abstract class Pricing {
    protected pricingClient: PricingClient = pricingClient;

    protected region: string = regions.CURRENT_REGION;

    protected currency: string = 'USD';

    protected _pricing: ProductPricing[] = [];

    abstract async init(): Promise<Pricing>;

    abstract calculateForDimension(dimension: Dimension): PricingResult;

    public constructor(injectedClient?: PricingClient) {
        if (injectedClient instanceof PricingClient) {
            this.pricingClient = injectedClient;
        }
    }

    public static getMonthlyEstimate(cost: number, diffInSeconds: number): number {
        const getForecastFactor = (diff: number): number => (3600 / diff) * window.MONTHLY;
        return Numbers.round(cost * getForecastFactor(diffInSeconds), 2);
    }

    public calculate(resourceDimensions: Dimension[]): PricingResult[] {
        return resourceDimensions.map(d => this.calculateForDimension(d));
    }

    public get pricing(): ProductPricing[] {
        return this._pricing;
    }

    protected getPricePerUnit(unit: string): number {
        const price = this._pricing.find(p => p.unit === unit);
        return price && price.pricePerUnit;
    }
}
