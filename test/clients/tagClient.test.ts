/* eslint-disable no-undef,object-curly-newline */
import * as AWS from 'aws-sdk';
import * as faker from 'faker';
import { GetResourcesInput, GetResourcesOutput } from 'aws-sdk/clients/resourcegroupstaggingapi';
import { SNSClient, TagClient } from '../../src/clients';
import { regions } from '../../src/config';
import { GetResourcesParams } from '../../src/clients/TagClient';

describe('SNSClient', () => {
    const awsTag = new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: regions.CURRENT_REGION });
    const client: TagClient = new TagClient(awsTag);

    beforeAll(() => {
        this.getResourcesMock = jest.fn();
        awsTag.getResources = this.getResourcesMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#getResources', () => {
        it('invokes aws.getResources', async () => {
            const output: GetResourcesOutput = { PaginationToken: faker.random.alphaNumeric(15) };
            const parameters: GetResourcesParams = {
                tagsPerPage: 5,
                tagFilters: [{ Key: faker.random.word(), Values: [faker.random.word()] }],
                resourceTypeFilters: [faker.random.word()],
            };
            const input: GetResourcesInput = {
                TagsPerPage: parameters.tagsPerPage,
                TagFilters: parameters.tagFilters,
                ResourceTypeFilters: parameters.resourceTypeFilters,
            };

            this.getResourcesMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.getResources(parameters)).resolves.toEqual(output);
            expect(awsTag.getResources).toHaveBeenCalledTimes(1);
            expect(awsTag.getResources).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });
});
