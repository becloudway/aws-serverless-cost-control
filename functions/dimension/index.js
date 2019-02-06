const LambdaDimension = require('./lambdaDimension');
const RdsDimension = require('./rdsDimension');
const DynamoDBDimension = require('./dynamodbDimension');

module.exports = {
    lambda: LambdaDimension,
    rds: RdsDimension,
    dynamodb: DynamoDBDimension,
};
