import { RESOURCE_MAP, TAGS, SERVICE_DYNAMODB } from '../config';
import { Resource } from './resource';
import { AWSTag, ResourceTag } from '../types';
import { tagClient } from '../clients';
import { GetResourcesParams } from '../clients/TagClient';

const getTagValue = (tags: AWSTag[], key: string): string => {
    const tag = tags.find(tagSet => tagSet.Key === key);
    return tag && tag.Value;
};

export class ResourceManager {
    private resources: Resource[] = [];

    private defaultCostLimit: number = 10;

    private includeTags: ResourceTag[];

    private excludeTags: ResourceTag[];

    public constructor(includeTags: ResourceTag[], excludeTags: ResourceTag[]) {
        this.includeTags = includeTags;
        this.excludeTags = excludeTags;
    }

    public async init(): Promise<ResourceManager> {
        const getResourcesParams: GetResourcesParams = {
            tagsPerPage: 500,
            resourceTypeFilters: RESOURCE_MAP,
        };
        if (this.includeTags.length > 0) {
            getResourcesParams.tagFilters = this.includeTags.map(t => ({ Key: t.key, Values: [t.value] }));
        }

        const taggedResources = await tagClient.getResources(getResourcesParams);

        if (!taggedResources) return this;

        this.resources = taggedResources.ResourceTagMappingList
            .filter(resource => resource.Tags
                .filter(t => this.excludeTags
                    .find(et => et.value === t.Value && et.key === t.Key)).length === 0)
            .map((res) => {
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
        return this.resources.filter(r => r.service === service && match.test(r.type));
    }

    public getResource(service: string, resourceId: string): Resource {
        const resource: Resource = this.resources.find(r => r.service === service && r.id === resourceId);
        return resource || null;
    }
}
