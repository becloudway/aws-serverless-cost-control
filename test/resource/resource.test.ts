/* eslint-disable no-undef */
import { Resource } from '../../src/resource';

const actionable = true;
const costLimit = 100;
const resource = new Resource(
    'service',
    'resourceId',
    'type',
    'region',
    'arn',
    actionable,
    costLimit,
);

describe('#Resource', () => {
    describe('#instantiation', () => {
        it('correctly instantiates a resource', () => {
            expect(resource).toBeInstanceOf(Resource);
        });
    });

    describe('#Accessors', () => {
        it('has service', () => {
            expect(resource.service).toEqual('service');
        });
        it('has resourceId', () => {
            expect(resource.resourceId).toEqual('resourceId');
        });
        it('has type', () => {
            expect(resource.type).toEqual('type');
        });
        it('has region', () => {
            expect(resource.region).toEqual('region');
        });
        it('has arn', () => {
            expect(resource.arn).toEqual('arn');
        });
        it('has actionable', () => {
            expect(resource.actionable).toEqual(actionable);
        });
        it('has costLimit', () => {
            expect(resource.costLimit).toEqual(costLimit);
        });
    });
});
