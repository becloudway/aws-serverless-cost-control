import * as AWS from 'aws-sdk';
import { GetProductsRequest, GetProductsResponse } from 'aws-sdk/clients/pricing';
import { regions } from '../config';
import { PriceDimensionJson, ProductPricing, ProductPricingJson } from '../types';
import { AWSClient, wrapCallback } from './AWSClient';

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

    public static buildProductsFromPriceList(pricelist: ProductPricingJson): ProductPricing {
        try {
            const terms = pricelist.terms && pricelist.terms[PricingClient.termType];

            const { priceDimensions } = terms[Object.keys(terms)[0]];
            const priceDimension: PriceDimensionJson = Object.keys(priceDimensions)
                .map((key: string): PriceDimensionJson => priceDimensions[key])
                .find((pd: PriceDimensionJson): boolean => pd.endRange === 'Inf');
            const pricePerUnit: string = priceDimension.pricePerUnit.USD || '0';

            return {
                group: pricelist.product.attributes.group,
                pricePerUnit: parseFloat(pricePerUnit),
                unit: priceDimension.unit,
                version: pricelist.version,
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

        if (!products || !products.PriceList) { return []; }
        // @ts-ignore
        return products.PriceList.map(PricingClient.buildProductsFromPriceList).filter((i: ProductPricing): boolean => i != null);
    }
}
