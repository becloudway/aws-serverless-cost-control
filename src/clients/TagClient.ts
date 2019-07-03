import * as AWS from 'aws-sdk';
import { GetResourcesInput, GetResourcesOutput, TagFilterList } from 'aws-sdk/clients/resourcegroupstaggingapi';
import { AWSClient, wrapCallback } from './AWSClient';

export interface GetResourcesParams {
    tagsPerPage: number;
    tagFilters: TagFilterList;
    resourceTypeFilters: string[];
}

export class TagClient extends AWSClient<AWS.ResourceGroupsTaggingAPI> {
    public getResources({ tagsPerPage, tagFilters, resourceTypeFilters }: GetResourcesParams): Promise<GetResourcesOutput> {
        return wrapCallback<GetResourcesInput, GetResourcesOutput>(this.client.getResources, {
            TagsPerPage: tagsPerPage,
            TagFilters: tagFilters,
            ResourceTypeFilters: resourceTypeFilters,
        });
    }
}
