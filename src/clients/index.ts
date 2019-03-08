import * as AWS from 'aws-sdk';
import { regions } from '../config';
import { CloudwatchClient } from './CloudwatchClient';
import { TagClient } from './TagClient';
import { PricingClient } from './PricingClient';
import { LambdaClient } from './LambdaClient';
import { DynamoDBClient } from './DynamoDBClient';
import { SNSClient } from './SNSClient';
import { RDSClient } from './RDSClient';

const { CURRENT_REGION: REGION, NORTH_VIRGINIA } = regions;
const cloudwatchClient = new CloudwatchClient(new AWS.CloudWatch({ apiVersion: '2010-08-01', region: REGION }));
const tagClient = new TagClient(new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: REGION }));
const pricingClient = new PricingClient(new AWS.Pricing({ apiVersion: '2017-10-15', region: NORTH_VIRGINIA }));
const lambdaClient = new LambdaClient(new AWS.Lambda({ apiVersion: '2015-03-31', region: REGION }), cloudwatchClient);
const rdsClient = new RDSClient(new AWS.RDS({ apiVersion: '2014-10-31', region: REGION }), cloudwatchClient);
const dynamodbClient = new DynamoDBClient(new AWS.DynamoDB({ apiVersion: '2012-08-10', region: REGION }), cloudwatchClient);
const snsClient = new SNSClient(new AWS.SNS({ apiVersion: '2010-03-31', region: REGION }));

export {
    cloudwatchClient,
    tagClient,
    pricingClient,
    lambdaClient,
    rdsClient,
    dynamodbClient,
    snsClient,
    PricingClient,
    LambdaClient,
    SNSClient,
    RDSClient,
    DynamoDBClient,
    TagClient,
    CloudwatchClient,
};
