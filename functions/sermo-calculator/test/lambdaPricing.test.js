const { LambdaDimension } = require('../dimension');
const { LambdaPricing } = require('../pricing');

const ONE_MILLION = 1000 * 1000;

const lambdaPricing = new LambdaPricing();
const start = new Date();
const end = new Date();
const lambdaFunction = {
    id: 'lambda-resource-id',
};
lambdaPricing.pricing = [
    {
        version: '20181212011734',
        group: 'AWS-Lambda-Requests',
        pricePerUnit: '0.0000002000',
        unit: 'Requests',
    },
    {
        version: '20181212011734',
        group: 'AWS-Lambda-Duration',
        pricePerUnit: '0.0000166667',
        unit: 'Second',
    },
];

test('calculates correct pricing #1', () => {
    const lambdaDimension = new LambdaDimension({ start, end, lambdaFunction });
    lambdaDimension.averageDuration = 1000;
    lambdaDimension.requestCount = 3 * ONE_MILLION;
    lambdaDimension.memory = 512;

    const pricingRecord = lambdaPricing.calculate([lambdaDimension], { includeFreeTier: true });
    expect(pricingRecord.monthlyComputeCharges).toEqual('18.33');
    expect(pricingRecord.monthlyRequestCharges).toEqual('0.40');
    expect(pricingRecord.totalCost).toEqual('18.73');
});

test('calculates correct pricing #2', () => {
    const lambdaDimension = new LambdaDimension({ start, end, lambdaFunction });
    lambdaDimension.averageDuration = 200;
    lambdaDimension.requestCount = 30 * ONE_MILLION;
    lambdaDimension.memory = 128;

    const pricingRecord = lambdaPricing.calculate([lambdaDimension], { includeFreeTier: true });
    expect(pricingRecord.monthlyComputeCharges).toEqual('5.83');
    expect(pricingRecord.monthlyRequestCharges).toEqual('5.80');
    expect(pricingRecord.totalCost).toEqual('11.63');
});

test('calculates correct pricing for multiple lambdas', () => {
    const lambdaDimension1 = new LambdaDimension({ start, end, lambdaFunction });
    lambdaDimension1.averageDuration = 200;
    lambdaDimension1.requestCount = 25 * ONE_MILLION;
    lambdaDimension1.memory = 128;
    const lambdaDimension2 = new LambdaDimension({ start, end, lambdaFunction });
    lambdaDimension2.averageDuration = 500;
    lambdaDimension2.requestCount = 5 * ONE_MILLION;
    lambdaDimension2.memory = 448;
    const lambdaDimension3 = new LambdaDimension({ start, end, lambdaFunction });
    lambdaDimension3.averageDuration = 1000;
    lambdaDimension3.requestCount = 2.5 * ONE_MILLION;
    lambdaDimension3.memory = 1024;

    const pricingRecord = lambdaPricing.calculate([lambdaDimension1, lambdaDimension2, lambdaDimension3], { includeFreeTier: true });
    expect(pricingRecord.monthlyComputeCharges).toEqual('63.65');
    expect(pricingRecord.monthlyRequestCharges).toEqual('6.30');
    expect(pricingRecord.totalCost).toEqual('69.95');
});
