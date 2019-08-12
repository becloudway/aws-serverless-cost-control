import * as AWS from 'aws-sdk';
import {GetProductsResponse, GetProductsRequest, PriceListItemJSON} from 'aws-sdk/clients/pricing';
import { ProductPricing } from '../types';
import { AWSClient, wrapCallback } from './AWSClient';
import { regions } from '../config';

export interface ProductFilter {
    field: string;
    value: string;
}

export interface GetProductsParams {
    serviceCode: string;
    region: string;
    filters?: ProductFilter[];
}

export class PricingClient extends AWSClient<AWS.Pricing> {
    private static termType: string = 'OnDemand';

    public static buildProductsFromPriceList(pricelist: any): ProductPricing {
        try {
            const terms = pricelist.terms && pricelist.terms[PricingClient.termType];

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
        } catch (e) {
            return null;
        }
    }

    public async getProducts({ serviceCode, region, filters = [] }: GetProductsParams): Promise<ProductPricing[]> {
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

        const products: GetProductsResponse = await wrapCallback<GetProductsRequest, GetProductsResponse>(this.client.getProducts.bind(this.client), {
            Filters: productFilters,
            ServiceCode: serviceCode,
        });

        if (!products || !products.PriceList) return [];
        return products.PriceList.map(PricingClient.buildProductsFromPriceList).filter(i => i != null);
    }
}
