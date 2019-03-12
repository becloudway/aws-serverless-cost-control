import * as AWS from 'aws-sdk';
import { GetProductsResponse } from 'aws-sdk/clients/pricing';
import { ProductPricing } from '../types';
import { AWSClient } from './AWSClient';
import { regions } from '../config';

export interface ProductFilter {
    field: string;
    value: string;
}

export interface GetProductsRequest {
    serviceCode: string;
    region: string;
    filters?: ProductFilter[];
}

export class PricingClient extends AWSClient<AWS.Pricing> {
    public async getProducts({ serviceCode, region, filters = [] }: GetProductsRequest): Promise<ProductPricing[]> {
        const termType = 'OnDemand';
        const defaultFilter = [
            {
                Field: 'location',
                Type: 'TERM_MATCH',
                Value: regions.NAME[region],
            },
            {
                Field: 'termType',
                Type: 'TERM_MATCH',
                Value: termType,
            },
        ];

        const productFilters = filters.map(f => ({
            Field: f.field,
            Type: 'TERM_MATCH',
            Value: f.value,
        })).concat(defaultFilter);

        const products: GetProductsResponse = await new Promise((resolve, reject) => this.client.getProducts({
            Filters: productFilters,
            ServiceCode: serviceCode,
        }, (err: Error, data: GetProductsResponse) => {
            if (err) reject(err);
            resolve(data);
        }));

        return products.PriceList.map((pr) => {
            const pricelist: any = pr as any;
            const terms = pricelist.terms[termType];
            const { priceDimensions } = terms[Object.keys(terms)[0]];
            const priceDimension = Object.keys(priceDimensions)
                .map(key => priceDimensions[key])
                .find(pd => pd.endRange === 'Inf');
            const pricePerUnit = priceDimension.pricePerUnit.USD || 0;

            return {
                version: pricelist.version,
                group: pricelist.product.attributes.group,
                pricePerUnit: parseFloat(pricePerUnit),
                unit: priceDimension.unit,
            };
        });
    }
}