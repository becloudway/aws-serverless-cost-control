/* eslint-disable no-undef */
import * as AWS from 'aws-sdk';
import {
    CreateStreamInput, DescribeStreamInput, DescribeStreamOutput, PutRecordInput, StreamDescription,
} from 'aws-sdk/clients/kinesis';
import { regions } from '../../src/config';
import { KinesisClient } from '../../src/clients';
import { Resource } from '../../src/resource';
import { buildRange, buildResource } from '../_helpers/builders';
import {DateRange, KinesisCostRecord} from '../../src/types';

import faker = require('faker');

describe('#KinesisClient', () => {
    const awsKinesis = new AWS.Kinesis({ apiVersion: '2013-12-02', region: regions.CURRENT_REGION });
    const client: KinesisClient = new KinesisClient(awsKinesis);
    const resource: Resource = buildResource();

    beforeAll(() => {
        this.describeStreamMock = jest.fn();
        this.createStreamMock = jest.fn();
        this.putRecordMock = jest.fn();

        awsKinesis.describeStream = this.describeStreamMock;
        awsKinesis.createStream = this.createStreamMock;
        awsKinesis.putRecord = this.putRecordMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#createStreamIfNotExists', () => {
        it('returns streamDescription of existing stream', async () => {
            const streamName = KinesisClient.buildStreamName(resource.id);
            const input: DescribeStreamInput = { StreamName: streamName };
            const output = { StreamName: streamName, StreamDescription: faker.lorem.sentence() };

            this.describeStreamMock.mockImplementation((data: any, callback: Function) => callback(null, output));
            await expect(client.createStreamIfNotExists(resource.id)).resolves.toEqual(output.StreamDescription);
            expect(awsKinesis.describeStream).toHaveBeenCalledTimes(1);
            expect(awsKinesis.describeStream).toHaveBeenCalledWith(input, expect.any(Function));
        });

        it('creates a stream if none exists', async () => {
            const streamName = KinesisClient.buildStreamName(resource.id);
            const describeInput: DescribeStreamInput = { StreamName: streamName };
            const createInput: CreateStreamInput = { StreamName: streamName, ShardCount: 1 };
            const output = { StreamName: streamName, StreamDescription: faker.lorem.sentence() };

            this.describeStreamMock.mockImplementationOnce((data: any, callback: Function) => callback(null, {}));
            this.describeStreamMock.mockImplementationOnce((data: any, callback: Function) => callback(null, output));
            this.createStreamMock.mockImplementationOnce((data: any, callback: Function) => callback(null, 'OK'));
            await expect(client.createStreamIfNotExists(resource.id)).resolves.toEqual(output.StreamDescription);
            expect(awsKinesis.describeStream).toHaveBeenCalledTimes(2);
            expect(awsKinesis.createStream).toHaveBeenCalledTimes(1);
            expect(awsKinesis.createStream).toHaveBeenCalledWith(createInput, expect.any(Function));
            expect(awsKinesis.describeStream).toHaveBeenCalledWith(describeInput, expect.any(Function));
        });
    });

    describe('#putRecord', () => {
        it('invokes aws.putRecord', async () => {
            const streamName = KinesisClient.buildStreamName(resource.id);
            const record: KinesisCostRecord = { cost: faker.random.number(), timestamp: new Date() };
            const input: PutRecordInput = {
                StreamName: streamName,
                Data: JSON.stringify(record),
                PartitionKey: 'partitionKey',
            };

            this.putRecordMock.mockImplementation((data: any, callback: Function) => callback(null, 'OK'));
            await expect(client.putRecord<KinesisCostRecord>(streamName, record)).resolves.toBeUndefined();
            expect(awsKinesis.putRecord).toHaveBeenCalledTimes(1);
            expect(awsKinesis.putRecord).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
});
