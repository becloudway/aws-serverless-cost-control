import * as AWS from 'aws-sdk';
import { GetResourcesInput, GetResourcesOutput, TagFilterList } from 'aws-sdk/clients/resourcegroupstaggingapi';
import { AWSClient } from './AWSClient';

export interface GetResourcesParams {
    tagsPerPage: number;
    tagFilters: TagFilterList;
    resourceTypeFilters: string[];
}

export class TagClient extends AWSClient<AWS.ResourceGroupsTaggingAPI> {
    public getResources({ tagsPerPage, tagFilters, resourceTypeFilters }: GetResourcesParams): Promise<GetResourcesOutput> {
        const params: GetResourcesInput = {
            TagsPerPage: tagsPerPage,
            TagFilters: tagFilters,
            ResourceTypeFilters: resourceTypeFilters,
        };
        return new Promise((resolve, reject) => this.client.getResources(params, (err: Error, data: GetResourcesOutput) => {
            if (err) reject(err);
            resolve(data);
        }));
    }
}
