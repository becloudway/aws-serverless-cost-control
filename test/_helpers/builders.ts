import * as faker from 'faker';
import { GetMetricStatisticsInput, MetricData, PutMetricDataInput } from 'aws-sdk/clients/cloudwatch';
import { subMinutes } from 'date-fns';
import { Resource } from '../../src/resource';
import { CloudwatchClient, MetricsDimension } from '../../src/clients/CloudwatchClient';
import { metrics } from '../../src/config';
import { DateRange } from '../../src/types';
import {SNSEventRecord} from "aws-lambda";

const buildResource = (options: any = {}): Resource => new Resource(
    options.service || faker.lorem.word(),
    options.resourceId || faker.lorem.word(),
    options.type || faker.lorem.word(),
    options.region || faker.lorem.word(),
    options.arn || faker.lorem.word(),
    typeof options.actionable === 'boolean' ? options.actionable : faker.random.boolean(),
    options.costLimit || faker.random.number(),
);

const buildMetricsStatisticsInput = (object: any): GetMetricStatisticsInput => ({
    Namespace: object.nameSpace || metrics.NAME_SPACE,
    MetricName: object.metricName,
    Dimensions: object.dimensions,
    StartTime: object.startTime,
    EndTime: object.endTime,
    Period: object.period || 60 * metrics.METRIC_WINDOW,
    Statistics: object.statistics || ['Average'],
});

const buildPutMetricDataInput = (object: any): PutMetricDataInput => {
    const metricData: MetricData = [{
        Timestamp: object.timestamp,
        Value: object.value,
        MetricName: object.metricName,
        Unit: 'Count',
    }];

    if (object.service && object.resourceId) {
        metricData[0].Dimensions = CloudwatchClient.buildCostDimensions(object.service, object.resourceId);
    }

    return {
        Namespace: metrics.NAME_SPACE,
        MetricData: metricData,
    };
};

const buildDimension = (name?: string, value?: string): MetricsDimension => ({
    Name: name || faker.lorem.word(),
    Value: value || faker.lorem.word(),
});

const buildAWSAccountId = (): string => faker.helpers.replaceSymbolWithNumber('#############');
const buildResourceId = (n: number = 3): string => faker.random.words(n).toLowerCase().split(' ').join('-');
const buildLambdaArn = (region: string, resourceId: string): string => `arn:aws:lambda:${region}:${buildAWSAccountId()}:function:${resourceId}`;
const buildDynamodbArn = (region: string, tablename: string): string => `arn:aws:dynamodb:${region}:${buildAWSAccountId()}:table/${tablename}`;
const buildRange = (): DateRange => ({
    start: subMinutes(new Date(), 10),
    end: subMinutes(new Date(), 5),
});

const buildSNSRecord = (resource: Resource): SNSEventRecord => ({
    EventVersion: faker.lorem.word(),
    EventSubscriptionArn: faker.lorem.word(),
    EventSource: faker.lorem.word(),
    Sns: {
        SignatureVersion: faker.lorem.word(),
        Timestamp: faker.date.recent().toISOString(),
        Signature: faker.lorem.word(),
        SigningCertUrl: faker.lorem.word(),
        MessageId: faker.lorem.word(),
        Message: faker.lorem.word(),
        MessageAttributes: {
            actionable: {
                Type: 'boolean',
                Value: `${resource.actionable}`,
            },
            serviceName: {
                Type: 'string',
                Value: `${resource.service}`,
            },
            resourceId: {
                Type: 'string',
                Value: `${resource.id}`,
            },
        },
        Type: faker.lorem.word(),
        UnsubscribeUrl: faker.lorem.word(),
        TopicArn: faker.lorem.word(),
        Subject: faker.lorem.word(),
    },
});

export {
    buildResource,
    buildPutMetricDataInput,
    buildMetricsStatisticsInput,
    buildDimension,
    buildAWSAccountId,
    buildDynamodbArn,
    buildResourceId,
    buildRange,
    buildLambdaArn,
    buildSNSRecord,
};
