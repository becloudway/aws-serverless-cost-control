/* eslint-disable no-undef */
import * as faker from 'faker';
// import { log } from '../../src/logger';
import { handler } from '../../src/functions/anomalyDetector';
import {
    DeliveryStatus,
    KinesisCostRecordWithAnomalyScore,
    KinesisStreamInputEvent,
    KinesisStreamRecord,
    LambdaOutput,
} from '../../src/types';
import { cloudwatchClient } from '../../src/clients';

jest.mock('../../src/logger');
const buildCostRecordData = (): KinesisCostRecordWithAnomalyScore => ({
    ANOMALY_SCORE: faker.random.number(),
    recordTimestamp: faker.date.recent(),
    resourceId: faker.random.word(),
    service: faker.random.word(),
    cost: faker.random.number(),
    timestamp: faker.date.recent(),
});

const buildKinesisRecord = (): KinesisStreamRecord => ({
    recordId: faker.random.uuid(),
    lambdaDeliveryRecordMetadata: {
        retryHint: faker.random.number(),
    },
    data: Buffer.from(JSON.stringify(buildCostRecordData()), 'utf-8').toString('base64'),
});

const inputEvent: KinesisStreamInputEvent = {
    invocationId: faker.random.uuid(),
    applicationArn: faker.random.word(),
    records: [
        buildKinesisRecord(),
        buildKinesisRecord(),
        buildKinesisRecord(),
    ],
};

describe('AnomdalyDetector', () => {
    beforeAll(() => {
        this.putAnomalyMetricDataMock = jest.fn();
        cloudwatchClient.putAnomalyMetricData = this.putAnomalyMetricDataMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    it('correctly processes anomaly datapoints' , async () => {
        const response: LambdaOutput = await handler(inputEvent);
        expect(this.putAnomalyMetricDataMock).toHaveBeenCalledTimes(inputEvent.records.length);
        inputEvent.records.forEach((r) => {
            const data: KinesisCostRecordWithAnomalyScore = JSON.parse(Buffer.from(r.data, 'base64').toString());
            expect(this.putAnomalyMetricDataMock).toHaveBeenCalledWith(new Date(data.recordTimestamp), data.ANOMALY_SCORE);
            expect(response.records).toContainEqual({ recordId: r.recordId, result: DeliveryStatus.Ok });
        });
    });

    it('record processing fails if record.data contains invalid json', async () => {
        const inputEventDup: KinesisStreamInputEvent = JSON.parse(JSON.stringify(inputEvent));
        inputEventDup.records[0].data = 'invalid json';
        const response: LambdaOutput = await handler(inputEventDup);
        expect(this.putAnomalyMetricDataMock).toHaveBeenCalledTimes(inputEvent.records.length - 1);
        expect(response.records[0].result).toEqual(DeliveryStatus.DeliveryFailed);
    });

    it('record processing fails if record.data is empty', async () => {
        const inputEventDup: KinesisStreamInputEvent = JSON.parse(JSON.stringify(inputEvent));
        inputEventDup.records[0].data = null;
        const response: LambdaOutput = await handler(inputEventDup);
        expect(this.putAnomalyMetricDataMock).toHaveBeenCalledTimes(inputEvent.records.length - 1);
        expect(response.records[0].result).toEqual(DeliveryStatus.DeliveryFailed);
    });

    it('returns empty record set when kinesis event does not meet requirements', async () => {
        const inputEventDup = JSON.parse(JSON.stringify(inputEvent));
        inputEventDup.records = 'invalid';
        const response: LambdaOutput = await handler(inputEventDup);
        expect(this.putAnomalyMetricDataMock).not.toHaveBeenCalled()
        expect(response.records).toEqual([]);
    });
});
