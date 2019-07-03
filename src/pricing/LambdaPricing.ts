import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Pricing } from './Pricing';
import { PricingResult, ProductPricing } from '../types';
import { LambdaDimension } from '../dimension';

const groups = ['AWS-Lambda-Duration', 'AWS-Lambda-Requests'];

const getComputeUsage = (lambdaDimension: LambdaDimension): number => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};

export class LambdaPricing extends Pricing {
    private _computePrice: number;

    private _requestPrice: number;

    public get computePrice(): number {
        return this._computePrice;
    }

    public get requestPrice(): number {
        return this._requestPrice;
    }

    public calculateForDimension(dimension: LambdaDimension): PricingResult {
        // by default, cost window is one minute and metric window 5 minutes
        const metricWindowMinutes = differenceInMinutes(dimension.end, dimension.start);
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / metricWindowMinutes;

        const computeUsage = getComputeUsage(dimension);
        const computeCharges = computeUsage * this._computePrice / metricWindowMinutes;
        const requestCharges = dimension.requestCount * this._requestPrice / metricWindowMinutes;
        const totalCost = computeCharges + requestCharges;

        return {
            currency: this.currency,
            estimatedMonthlyCharge: LambdaPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: { computeCharges, requestCharges },
        };
    }

    public async init(): Promise<LambdaPricing> {
        const pricing: ProductPricing[] = await this.pricingClient.getProducts({ serviceCode: 'AWSLambda', region: this.region });
        if (!pricing) return this;

        this._pricing = pricing.filter(pr => groups.includes(pr.group));
        this._computePrice = this.getPricePerUnit('Second') || this.getPricePerUnit('seconds');
        this._requestPrice = this.getPricePerUnit('Requests');

        return this;
    }
}
