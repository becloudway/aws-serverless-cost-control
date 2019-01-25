const { regions } = require('../config');

const groups = ['AWS-Lambda-Duration', 'AWS-Lambda-Requests'];

module.exports = class Pricing {
    constructor(client) {
        this.client = client;
    }

    /*
     *"PriceList": [
    {
      "product": {
        "productFamily": "Serverless",
        "attributes": {
          "servicecode": "AWSLambda",
          "groupDescription": "Invocation call for a Lambda function",
          "usagetype": "EU-Request",
          "locationType": "AWS Region",
          "location": "EU (Ireland)",
          "servicename": "AWS Lambda",
          "operation": "",
          "group": "AWS-Lambda-Requests"
        },
        "sku": "B5V2RNHAWGVJBZD3"
      },
      "serviceCode": "AWSLambda",
      "terms": {
        "OnDemand": {
          "B5V2RNHAWGVJBZD3.JRTCKXETXF": {
            "priceDimensions": {
              "B5V2RNHAWGVJBZD3.JRTCKXETXF.6YS6EN2CT7": {
                "unit": "Requests",
                "endRange": "Inf",
                "description": "AWS Lambda - Total Requests - EU (Ireland)",
                "appliesTo": [],
                "rateCode": "B5V2RNHAWGVJBZD3.JRTCKXETXF.6YS6EN2CT7",
                "beginRange": "0",
                "pricePerUnit": {
                  "USD": "0.0000002000"
                }
              }
            },
            "sku": "B5V2RNHAWGVJBZD3",
            "effectiveDate": "2018-11-01T00:00:00Z",
            "offerTermCode": "JRTCKXETXF",
            "termAttributes": {}
          }
        }
      },
      "version": "20181212011734",
      "publicationDate": "2018-12-12T01:17:34Z"
    },
    */
    async getProducts({ serviceCode, region, termsType = 'OnDemand' }) {
        const products = await new Promise((resolve, reject) => this.client.getProducts({
            Filters: [
                {
                    Field: 'location',
                    Type: 'TERM_MATCH',
                    Value: regions.NAME[region],
                },
            ],
            ServiceCode: serviceCode,
        }, (err, data) => {
            if (err) reject(err);
            resolve(data);
        }));

        return products.PriceList.map((pr) => {
            const terms = pr.terms[termsType];
            const priceDimensions = terms[Object.keys(terms)[0]].priceDimensions;
            const priceDimension = priceDimensions[Object.keys(priceDimensions)[0]];

            return {
                version: pr.version,
                group: pr.product.attributes.group,
                pricePerUnit: priceDimension.pricePerUnit.USD,
                unit: priceDimension.unit,
            };
        }).filter(pl => groups.includes(pl.group));
    }
};
