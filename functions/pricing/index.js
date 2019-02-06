const LambdaPricing = require('./lambdaPricing');
const RdsPricing = require('./rdsPricing');
const DynamoDBPricing = require('./dynamodbPricing');

module.exports = {
    dynamodb: DynamoDBPricing,
    lambda: LambdaPricing,
    rds: RdsPricing,
};
