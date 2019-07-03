/* eslint-disable no-undef */

import { subMinutes } from 'date-fns';
import { Dimension } from '../../src/dimension';
import { buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';

class DimensionImpl extends Dimension {
    public async create(): Promise<Dimension> {
        return Promise.resolve(this);
    }
}

describe('#Dimension.AbstractClass', () => {
    let dimension: DimensionImpl;
    const resource: Resource = buildResource();
    const end = subMinutes(new Date(), 1);
    const start = subMinutes(end, 1);

    describe('#instantiation', () => {
        it('is instantiated with resource, start, end', () => {
            expect(new DimensionImpl(resource, start, end)).toBeInstanceOf(DimensionImpl);
        });

        it('throws when enddate is before startdate', () => {
            expect(() => new DimensionImpl(resource, end, start)).toThrowError();
        });

        it('has an abstract method "create"', () => {
            dimension = new DimensionImpl(resource, start, end);
            expect(dimension.create).toBeInstanceOf(Function);
        });
    });

    describe('#accessors', () => {
        beforeEach(() => {
            dimension = new DimensionImpl(resource, start, end);
        });

        it('has resource', () => {
            expect(dimension.resource).toEqual(resource);
        });

        it('has start', () => {
            expect(dimension.start).toEqual(start);
        });

        it('has end', () => {
            expect(dimension.end).toEqual(end);
        });
    });
});
