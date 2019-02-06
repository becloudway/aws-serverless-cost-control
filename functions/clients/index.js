const AWS = require('aws-sdk');
const config = require('../config');
const Lambda = require('./lambda');
const Tag = require('./tag');
const Cloudwatch = require('./cloudwatch');
const Pricing = require('./pricing');
const Rds = require('./rds');
const DynamoDB = require('./dynamodb');


const { CURRENT_REGION: REGION, NORTH_VIRGINIA } = config.regions;
const cloudwatchClient = new Cloudwatch(new AWS.CloudWatch({ apiVersion: '2010-08-01', region: REGION }));
const tagClient = new Tag(new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: REGION }));
const pricingClient = new Pricing(new AWS.Pricing({ apiVersion: '2017-10-15', region: NORTH_VIRGINIA }));
const lambdaClient = new Lambda(new AWS.Lambda({ apiVersion: '2015-03-31', region: REGION }), cloudwatchClient);
const rdsClient = new Rds(new AWS.RDS({ apiVersion: '2014-10-31', region: REGION }), cloudwatchClient);
const dynamodbClient = new DynamoDB(new AWS.DynamoDB({ apiVersion: '2012-08-10' }), cloudwatchClient);

module.exports = {
    CLOUDWATCH: cloudwatchClient,
    TAG: tagClient,
    LAMBDA: lambdaClient,
    PRICING: pricingClient,
    RDS: rdsClient,
    DYNAMODB: dynamodbClient,
};
