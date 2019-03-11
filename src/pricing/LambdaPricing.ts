import {differenceInMinutes, differenceInSeconds} from 'date-fns';
import { Pricing } from './Pricing';
import { PricingResult, ProductPricing } from '../types';
import { Dimension, LambdaDimension } from '../dimension';
import {round} from "../util";

const groups = ['AWS-LambdaClient-Duration', 'AWS-LambdaClient-Requests'];

const getComputeUsage = (lambdaDimension: LambdaDimension): number => {
    const totalComputeSeconds = lambdaDimension.requestCount * (lambdaDimension.averageDuration / 1000);
    return (totalComputeSeconds * lambdaDimension.memory) / 1024;
};

export class LambdaPricing extends Pricing {
    private computePrice: number;

    private requestPrice: number;

    private pricing: ProductPricing[];

    public calculateForDimension(dimension: LambdaDimension): PricingResult {
        // by default, cost window is one minute and metric window 5 minutes
        const metricWindowMinutes = differenceInMinutes(dimension.end, dimension.start);
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / metricWindowMinutes;

        const computeUsage = getComputeUsage(dimension);
        const computeCharges = computeUsage * this.computePrice / metricWindowMinutes;
        const requestCharges = dimension.requestCount * this.requestPrice / metricWindowMinutes;
        const totalCost = computeCharges + requestCharges;

        return {
            currency: this.currency,
            estimatedMonthlyCharge: LambdaPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost: round(totalCost, 2),
            breakdown: {
                computeCharges: round(computeCharges, 2),
                requestCharges: round(requestCharges, 2),
            },
        };
    }

    public async init(): Promise<LambdaPricing> {
        const pricing: ProductPricing[] = await this.pricingClient.getProducts({
            serviceCode: 'AWSLambda',
            region: this.region,
        });

        this.pricing = pricing.filter(pr => groups.includes(pr.group));
        this.computePrice = this.pricing.find(p => p.unit === 'Second' || p.unit === 'seconds').pricePerUnit;
        this.requestPrice = this.pricing.find(p => p.unit === 'Requests').pricePerUnit;

        return this;
    }
}
