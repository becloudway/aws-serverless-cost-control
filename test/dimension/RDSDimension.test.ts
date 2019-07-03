/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { RDSDimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';
import { SERVICE_RDS } from '../../src/config';
import { rdsClient } from '../../src/clients';

describe('#RDSDimension', () => {
    let dimension: RDSDimension;
    const resource: Resource = buildResource({ service: SERVICE_RDS });
    const end = subMinutes(new Date(), 1);
    const start = subMinutes(end, 1);


    describe('#accessors', () => {
        beforeEach(() => {
            dimension = new RDSDimension(resource, start, end);
        });

        it('has auroraCapacityUnits getter', () => {
            expect(dimension).toHaveProperty('auroraCapacityUnits', 0);
        });
        it('has storedGiBs getter', () => {
            expect(dimension).toHaveProperty('storedGiBs', 0);
        });
        it('has ioRequests getter', () => {
            expect(dimension).toHaveProperty('ioRequests', 0);
        });
    });

    describe('#create', () => {
        const acus = 4;
        const ioRequests = 500 * 1000 * 1000;
        const storedGibs = 500 * 1000;

        beforeEach(() => {
            rdsClient.getACUs = jest.fn().mockResolvedValue(acus);
            rdsClient.getIoRequests = jest.fn().mockResolvedValue(ioRequests);
            rdsClient.getStoredGiBs = jest.fn().mockResolvedValue(storedGibs);
            dimension = new RDSDimension(resource, start, end);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('returns instance of dimension', async () => {
            await expect(dimension.create()).resolves.toBeInstanceOf(RDSDimension);
        });

        it('fetches aurora RDS parameters from aws and sets corresponding properties', async () => {
            await dimension.create();

            expect(rdsClient.getACUs).toHaveBeenCalledTimes(1);
            expect(rdsClient.getACUs).toHaveBeenCalledWith(resource.id, start, end);
            expect(dimension.auroraCapacityUnits).toEqual(acus);

            expect(rdsClient.getIoRequests).toHaveBeenCalledTimes(1);
            expect(rdsClient.getIoRequests).toHaveBeenCalledWith(resource.id, start, end);
            expect(dimension.ioRequests).toEqual(ioRequests);

            expect(rdsClient.getStoredGiBs).toHaveBeenCalledTimes(1);
            expect(rdsClient.getStoredGiBs).toHaveBeenCalledWith(resource.id, start, end);
            expect(dimension.storedGiBs).toEqual(storedGibs);
        });
    });
});
