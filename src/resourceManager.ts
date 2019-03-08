import { RESOURCE_MAP, TAGS } from './config';
import { Resource } from './resource';
import { AWSTag, ResourceTag } from './types';
import { tagClient } from './clients';

const getTagValue = (tags: AWSTag[], key: string): string => {
    const tag = tags.find(tagSet => tagSet.Key === key);
    return tag && tag.Value;
};

export class ResourceManager {
    private resources: Resource[] = [];

    private defaultCostLimit: number = 10;

    private tagKey: string;

    private tagValue: string;

    public constructor(resourceTag: ResourceTag) {
        this.tagKey = resourceTag.key;
        this.tagValue = resourceTag.value;
    }

    public async init(): Promise<ResourceManager> {
        const taggedResources = await tagClient.getResources({
            tagsPerPage: 500,
            tagFilters: [{
                Key: this.tagKey,
                Values: [this.tagValue],
            }],
            resourceTypeFilters: RESOURCE_MAP,
        });

        this.resources = taggedResources.ResourceTagMappingList.map((res) => {
            const arn = res.ResourceARN;
            const tags = res.Tags;
            const actionable = getTagValue(tags, TAGS.SCC_ACTIONABLE) === 'true';
            const costLimit = parseInt((getTagValue(tags, TAGS.SCC_COST_LIMIT)), 10);

            // eslint-disable-next-line prefer-const
            let [,, service, region,, type, resourceId] = arn.split(':');

            if (service === 'dynamodb') {
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
        return this.resources.filter(r => r.service === service && match.test(r.type));
    }

    public getResource(service: string, resourceId: string): Resource {
        return this.resources.find(r => r.service === service && r.id === resourceId);
    }
}
