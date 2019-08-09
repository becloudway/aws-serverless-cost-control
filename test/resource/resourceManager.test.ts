/* eslint-disable no-undef */

import * as faker from 'faker';

import { Resource, ResourceManager } from '../../src/resource';
import { ResourceTag } from '../../src/types';
import { tagClient } from '../../src/clients';
import {
    RESOURCE_DYNAMODB_TABLE,
    RESOURCE_LAMBDA_FUNCTION,
    RESOURCE_RDS_CLUSTER_INSTANCE,
    SERVICE_DYNAMODB,
    SERVICE_LAMBDA,
    SERVICE_RDS,
    TAGS,
} from '../../src/config';
import { buildDynamodbArn, buildLambdaArn, buildResourceId } from '../_helpers/builders';

const AWSRegion = 'eu-west-1';
const lambdaResourceId = buildResourceId(3);
const dynamodbResourceId = buildResourceId(3);
const lambdaResource: Resource = new Resource(
    SERVICE_LAMBDA,
    lambdaResourceId,
    RESOURCE_LAMBDA_FUNCTION,
    AWSRegion,
    buildLambdaArn(AWSRegion, lambdaResourceId),
    true,
    100,
);

const dynamodbResource = new Resource(
    SERVICE_DYNAMODB,
    dynamodbResourceId,
    RESOURCE_DYNAMODB_TABLE,
    AWSRegion,
    buildDynamodbArn(AWSRegion, dynamodbResourceId),
    false,
    50,
);

let resourceTag: ResourceTag;
let resourceManager: ResourceManager;

describe('ResourceManager', () => {
    beforeEach(async () => {
        this.tagclientMock = jest.fn();
        tagClient.getResources = this.tagclientMock;
        this.tagclientMock.mockReturnValueOnce({
            ResourceTagMappingList: [
                {
                    ResourceARN: lambdaResource.arn,
                    Tags: [
                        {
                            Key: TAGS.SCC_ACTIONABLE,
                            Value: lambdaResource.actionable.toString(),
                        },
                        {
                            Key: TAGS.SCC_COST_LIMIT,
                            Value: lambdaResource.costLimit.toString(),
                        },
                        {
                            Key: 'exclude_this_key',
                            Value: 'exclude_this_value',
                        },
                    ],
                },
                {
                    ResourceARN: dynamodbResource.arn,
                    Tags: [
                        {
                            Key: TAGS.SCC_ACTIONABLE,
                            Value: dynamodbResource.actionable.toString(),
                        },
                        {
                            Key: TAGS.SCC_COST_LIMIT,
                            Value: dynamodbResource.costLimit.toString(),
                        },
                    ],
                },
            ],
        });

        resourceTag = { key: faker.lorem.slug(1), value: faker.lorem.slug(3) };
        resourceManager = await new ResourceManager([], []).init();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('#init', () => {
        it('correctly initialises the resourceManager for multiple services', async () => {
            expect(resourceManager).toBeInstanceOf(ResourceManager);
            expect(resourceManager.getResources).toBeInstanceOf(Function);
            expect(resourceManager.getResource).toBeInstanceOf(Function);
        });

        it('correctly calls tagClient with includeTags', async () => {
            const includeTag = { key: faker.lorem.word(), value: faker.lorem.word() };

            resourceManager = await new ResourceManager([includeTag], []).init();

            expect(this.tagclientMock).toHaveBeenLastCalledWith({
                tagsPerPage: expect.any(Number),
                tagFilters: [{ Key: includeTag.key, Values: [includeTag.value] }],
                resourceTypeFilters: expect.any(Object),
            });
        });

        it('correctly initialises the resourceManager for a resource where costLimit tag is invalid', async () => {
            this.tagclientMock.mockReturnValueOnce({
                ResourceTagMappingList: [
                    {
                        ResourceARN: lambdaResource.arn,
                        Tags: [
                            {
                                Key: TAGS.SCC_ACTIONABLE,
                                Value: lambdaResource.actionable.toString(),
                            },
                            {
                                Key: TAGS.SCC_COST_LIMIT,
                                Value: 'invalid',
                            },
                        ],
                    },
                ],
            });

            resourceManager = await new ResourceManager([], []).init();
            expect(resourceManager.getResource(SERVICE_LAMBDA, lambdaResourceId).costLimit).toEqual(10);
        });

        it('correctly initialises when AWS return null on the request', async () => {
            this.tagclientMock.mockReturnValue(null);
            resourceManager = await new ResourceManager([], []).init();
            expect(resourceManager.getResources).toBeInstanceOf(Function);
            expect(resourceManager.getResource).toBeInstanceOf(Function);
        });

        it('correctly initialises when AWS return null resources', async () => {
            this.tagclientMock.mockReturnValue({ ResourceTagMappingList: [] });
            resourceManager = await new ResourceManager([], []).init();
            expect(resourceManager.getResources).toBeInstanceOf(Function);
            expect(resourceManager.getResource).toBeInstanceOf(Function);
        });
    });

    describe('#getResources', () => {
        it('correctly filters out all resources with exclude tags', async () => {
            const excludeTags = [{ key: 'exclude_this_key', value: 'exclude_this_value' }];
            resourceManager = await new ResourceManager([], excludeTags).init();
            expect(resourceManager.getResources(SERVICE_LAMBDA, RESOURCE_LAMBDA_FUNCTION)).toHaveLength(0);
        });

        it('returns all resources for a lambda/rds service', async () => {
            const resources: Resource[] = resourceManager.getResources(SERVICE_LAMBDA, RESOURCE_LAMBDA_FUNCTION);
            expect(resources.length).toEqual(1);
            expect(resources[0]).toEqual(lambdaResource);
        });

        it('returns all resources for a dynamodb service', async () => {
            const resources: Resource[] = resourceManager.getResources(SERVICE_DYNAMODB, RESOURCE_DYNAMODB_TABLE);
            expect(resources.length).toEqual(1);
            expect(resources[0]).toEqual(dynamodbResource);
        });

        it('returns empty if no resources are available', async () => {
            const resources: Resource[] = resourceManager.getResources(SERVICE_RDS, RESOURCE_RDS_CLUSTER_INSTANCE);
            expect(resources).toEqual([]);
        });

        it('returns empty when non-existing service is asked for', async () => {
            const resources: Resource[] = resourceManager.getResources(faker.lorem.word(), RESOURCE_DYNAMODB_TABLE);
            expect(resources).toEqual([]);
        });

        it('returns empty when non-existing resource is asked for', async () => {
            const resources: Resource[] = resourceManager.getResources(faker.lorem.word(), RESOURCE_DYNAMODB_TABLE);
            expect(resources).toEqual([]);
        });
    });

    describe('#getResource', () => {
        it('returns a resource based on service and resourceId', () => {
            const resource: Resource = resourceManager.getResource(SERVICE_LAMBDA, lambdaResourceId);
            expect(resource).toEqual(lambdaResource);
        });

        it('returns null when resource does not exist', () => {
            const resource: Resource = resourceManager.getResource(SERVICE_LAMBDA, faker.lorem.word());
            expect(resource).toBeNull();
        });
    });
});
