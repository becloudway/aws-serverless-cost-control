"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
const config_1 = require("../config");
class Pricing extends AWSClient_1.AWSClient {
    async getProducts({ serviceCode, region, filters = [] }) {
        const termType = 'OnDemand';
        const defaultFilter = [
            {
                Field: 'location',
                Type: 'TERM_MATCH',
                Value: config_1.regions.NAME[region],
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
        const products = await new Promise((resolve, reject) => this.client.getProducts({
            Filters: productFilters,
            ServiceCode: serviceCode,
        }, (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        }));
        return products.PriceList.map((pr) => {
            const terms = pr.terms[termType];
            const { priceDimensions } = terms[Object.keys(terms)[0]];
            const priceDimension = Object.keys(priceDimensions)
                .map(key => priceDimensions[key])
                .find(pd => pd.endRange === 'Inf');
            return {
                version: pr.version,
                group: pr.product.attributes.group,
                pricePerUnit: priceDimension.pricePerUnit.USD,
                unit: priceDimension.unit,
            };
        });
    }
}
exports.Pricing = Pricing;
;
//# sourceMappingURL=pricing.js.map