import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Pricing } from './Pricing';
import { RDSDimension } from '../dimension';
import { window } from '../config';
import { PricingResult } from '../types';

export class RDSPricing extends Pricing {
    private monthlyStoragePrice: number;

    private hourlyACUPrice: number;

    private iopsPrice: number;

    public async init(): Promise<RDSPricing> {
        const acuPricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'serverless' },
            ],
        });

        const iopsPricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'System Operation' },
                { field: 'group', value: 'Aurora I/O Operation' },
                { field: 'databaseEngine', value: 'any' },
            ],
        });

        const storagePricing = await this.pricingClient.getProducts({
            serviceCode: 'AmazonRDS',
            region: this.region,
            filters: [
                { field: 'productFamily', value: 'Database Storage' },
                { field: 'volumeType', value: 'General Purpose-Aurora' },
                { field: 'databaseEngine', value: 'any' },
            ],
        });

        this.monthlyStoragePrice = storagePricing[0] && storagePricing[0].pricePerUnit;
        this.hourlyACUPrice = acuPricing[0] && acuPricing[0].pricePerUnit;
        this.iopsPrice = iopsPricing[0] && iopsPricing[0].pricePerUnit;

        return this;
    }

    public calculateForDimension(dimension: RDSDimension): PricingResult {
        // by default, cost window is one minute and metric window 5 minutes
        const metricWindowMinutes = differenceInMinutes(dimension.end, dimension.start);
        const costWindowSeconds = differenceInSeconds(dimension.end, dimension.start) / metricWindowMinutes;

        const ACUCost = (dimension.auroraCapacityUnits * this.hourlyACUPrice) / 60; // cost per minute
        const storageCost = (dimension.storedGiBs * this.monthlyStoragePrice) / (10 ** 9) / window.MONTHLY / 60; // cost per minute
        const iopsCost = dimension.ioRequests * this.iopsPrice / metricWindowMinutes;
        const totalCost = ACUCost + storageCost + iopsCost;

        return {
            currency: this.currency,
            estimatedMonthlyCharge: RDSPricing.getMonthlyEstimate(totalCost, costWindowSeconds),
            totalCostWindowSeconds: costWindowSeconds,
            totalCost,
            breakdown: {
                storageCharges: storageCost,
                iopsCharges: iopsCost,
                ACUCharges: ACUCost,
            },
        };
    }
}
