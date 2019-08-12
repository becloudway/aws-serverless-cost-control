import { TagFilter } from 'aws-sdk/clients/resourcegroupstaggingapi';
import { RESOURCE_MAP, SERVICE_DYNAMODB, TAGS } from '../config';
import { Resource } from './resource';
import { AWSTag, ResourceTag } from '../types';
import { tagClient } from '../clients';
import { GetResourcesParams } from '../clients/TagClient';

const getTagValue = (tags: AWSTag[], key: string): string => {
    const tag = tags.find((tagSet): boolean => tagSet.Key === key);
    return tag && tag.Value;
};

export class ResourceManager {
    private resources: Resource[] = [];

    private defaultCostLimit: number = 10;

    public async init(includeTags: ResourceTag[], excludeTags: ResourceTag[]): Promise<ResourceManager> {
        const getResourcesParams: GetResourcesParams = {
            tagsPerPage: 500,
            resourceTypeFilters: RESOURCE_MAP,
            tagFilters: includeTags.length > 0 ? includeTags.map((t): TagFilter => ({ Key: t.key, Values: [t.value] })) : null,
        };

        const taggedResources = await tagClient.getResources(getResourcesParams);

        if (!taggedResources) return this;

        this.resources = taggedResources.ResourceTagMappingList
            .filter((resource): boolean => resource.Tags
                .filter((t): ResourceTag => excludeTags
                    .find((et): boolean => et.value === t.Value && et.key === t.Key)).length === 0)
            .map((res): Resource => {
                const arn = res.ResourceARN;
                const tags = res.Tags;
                const actionable = getTagValue(tags, TAGS.SCC_ACTIONABLE) === 'true';
                const costLimit = parseInt((getTagValue(tags, TAGS.SCC_COST_LIMIT)), 10);

                // eslint-disable-next-line prefer-const
                let [,, service, region,, type, resourceId] = arn.split(':');

                if (service === SERVICE_DYNAMODB) {
                    [type, resourceId] = type.split('/');
                }

                return new Resource(
                    service,
                    resourceId,
                    type,
                    region,
                    arn,
                    actionable,
                    Number.isNaN(costLimit) ? this.defaultCostLimit : costLimit,
                );
            });

        return this;
    }

    public getResources(service: string, type: string): Resource[] {
        const match = new RegExp(`^${type}`);
        return this.resources.filter((r): boolean => r.service === service && match.test(r.type));
    }

    public getResource(service: string, resourceId: string): Resource {
        const resource: Resource = this.resources.find((r): boolean => r.service === service && r.id === resourceId);
        return resource || null;
    }
}
