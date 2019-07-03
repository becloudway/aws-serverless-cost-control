/* eslint-disable no-undef */
import * as faker from 'faker';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';
import { handler } from '../../src/functions/resourceThrottler';
import {
    DeliveryStatus,
    KinesisCostRecordWithAnomalyScore,
    KinesisStreamInputEvent,
    KinesisStreamRecord,
    LambdaOutput, LambdaResponse,
} from '../../src/types';
import { lambdaClient, rdsClient, dynamodbClient } from '../../src/clients';
import { Resource } from '../../src/resource';
import { buildResource, buildResourceId } from '../_helpers/builders';
import { SERVICE_DYNAMODB, SERVICE_LAMBDA, SERVICE_RDS } from '../../src/config';

jest.mock('../../src/logger');
const buildCostRecordData = (): KinesisCostRecordWithAnomalyScore => ({
    ANOMALY_SCORE: faker.random.number(),
    recordTimestamp: faker.date.recent(),
    resourceId: faker.random.word(),
    service: faker.random.word(),
    cost: faker.random.number(),
    timestamp: faker.date.recent(),
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

const buildInputEvent = (resources: Resource[]): SNSEvent => ({
    Records: resources.map(r => buildSNSRecord(r)),
});

describe('ResourceThrottler', () => {
    beforeAll(() => {
        this.lambdaThrottle = jest.fn();
        this.rdsThrottle = jest.fn();
        this.dynamodbThrottle = jest.fn();

        lambdaClient.throttle = this.lambdaThrottle;
        rdsClient.throttle = this.rdsThrottle;
        dynamodbClient.throttle = this.dynamodbThrottle;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    it('correctly throttles an actionable lambda resource', async () => {
        const actionableResource = buildResource({ service: SERVICE_LAMBDA, actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        const response: LambdaResponse = await handler(inputEvent);
        expect(this.lambdaThrottle).toHaveBeenCalledTimes(1);
        expect(this.lambdaThrottle).toHaveBeenCalledWith(actionableResource.resourceId, 0);
        expect(response.status).toEqual(200);
    });

    it('correctly throttles an actionable rds resource', async () => {
        const actionableResource = buildResource({ service: SERVICE_RDS, actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        const response: LambdaResponse = await handler(inputEvent);
        expect(this.rdsThrottle).toHaveBeenCalledTimes(1);
        expect(this.rdsThrottle).toHaveBeenCalledWith(actionableResource.resourceId, { autoPause: true, maxCapacity: 2, minCapacity: 2 });
        expect(response.status).toEqual(200);
    });

    it('correctly throttles an actionable dynamobd resource', async () => {
        const actionableResource = buildResource({ service: SERVICE_DYNAMODB, actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        const response: LambdaResponse = await handler(inputEvent);
        expect(this.dynamodbThrottle).toHaveBeenCalledTimes(1);
        expect(this.dynamodbThrottle).toHaveBeenCalledWith(actionableResource.resourceId, { readCapacityUnits: 1, writeCapacityUnits: 1 });
        expect(response.status).toEqual(200);
    });

    it('only throttles actionable resources', async () => {
        const actionableResource = buildResource({ service: SERVICE_LAMBDA, actionable: true });
        const notActionableResource = buildResource({ service: SERVICE_LAMBDA, actionable: false });
        const inputEvent = buildInputEvent([actionableResource, notActionableResource]);
        const response: LambdaResponse = await handler(inputEvent);
        expect(this.lambdaThrottle).toHaveBeenCalledTimes(1);
        expect(this.lambdaThrottle).toHaveBeenCalledWith(actionableResource.resourceId, 0);
        expect(response.status).toEqual(200);
    });

    it('returns 400 when trying to throttle unknown resource', async () => {
        const actionableResource = buildResource({ service: 'unknown-resource', actionable: true });
        const inputEvent = buildInputEvent([actionableResource]);
        const response: LambdaResponse = await handler(inputEvent);
        expect(response.status).toEqual(400);
        expect(response.message).toEqual('Unknown service');
    });

    it('returns 400 when event is not correctly formed', async () => {
        const inputEvent: any = {};
        const response: LambdaResponse = await handler(inputEvent);
        expect(response.status).toEqual(400);
    });
});
