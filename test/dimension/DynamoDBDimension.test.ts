/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { DynamoDBDimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';
import { SERVICE_DYNAMODB } from '../../src/config';
import { dynamodbClient } from '../../src/clients';

describe('#DynamoDSDimension', () => {
    let dimension: DynamoDBDimension;
    const resource: Resource = buildResource({ service: SERVICE_DYNAMODB });
    const end = subMinutes(new Date(), 1);
    const start = subMinutes(end, 1);


    describe('#accessors', () => {
        beforeEach(() => {
            dimension = new DynamoDBDimension(resource, start, end);
        });

        it('has readCapacityUnits getter', () => {
            expect(dimension).toHaveProperty('readCapacityUnits', 0);
        });
        it('has writeCapacityUnits getter', () => {
            expect(dimension).toHaveProperty('writeCapacityUnits', 0);
        });
        it('has storageSizeBytes getter', () => {
            expect(dimension).toHaveProperty('storageSizeBytes', 0);
        });
    });

    describe('#create', () => {
        const storageSizeBytes = 56 * 1000;
        const writeCapacityUnits = 2;
        const readCapacityUnits = 5;

        beforeEach(() => {
            dynamodbClient.getReadCapacityUnits = jest.fn().mockResolvedValue(readCapacityUnits);
            dynamodbClient.getWriteCapacityUnits = jest.fn().mockResolvedValue(writeCapacityUnits);
            dynamodbClient.describeTable = jest.fn().mockResolvedValue({ Table: { TableSizeBytes: storageSizeBytes } });
            dimension = new DynamoDBDimension(resource, start, end);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('returns instance of dimension', async () => {
            await expect(dimension.create()).resolves.toBeInstanceOf(DynamoDBDimension);
        });

        it('fetches dynamoeDB table parameters from aws and sets corresponding properties', async () => {
            await dimension.create();

            expect(dynamodbClient.describeTable).toHaveBeenCalledTimes(1);
            expect(dynamodbClient.describeTable).toHaveBeenCalledWith(resource.id);
            expect(dimension.storageSizeBytes).toEqual(storageSizeBytes);

            expect(dynamodbClient.getReadCapacityUnits).toHaveBeenCalledTimes(1);
            expect(dynamodbClient.getReadCapacityUnits).toHaveBeenCalledWith(resource, start, end);
            expect(dimension.readCapacityUnits).toEqual(readCapacityUnits);

            expect(dynamodbClient.getWriteCapacityUnits).toHaveBeenCalledTimes(1);
            expect(dynamodbClient.getWriteCapacityUnits).toHaveBeenCalledWith(resource, start, end);
            expect(dimension.writeCapacityUnits).toEqual(writeCapacityUnits);
        });
    });
});
