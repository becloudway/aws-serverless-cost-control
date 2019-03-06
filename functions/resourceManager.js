const config = require('./config');
const { TAG } = require('./clients');
const Resource = require('./resource');

const getTagValue = (tags, key) => {
    const tag = tags.find(tagSet => tagSet.Key === key);
    return tag && tag.Value;
};

module.exports = class ResourceManager {
    constructor({ tagKey, tagValue }) {
        this.defaultCostLimit = 10;
        this.tagKey = tagKey;
        this.tagValue = tagValue;
        this.resources = [];
    }

    async init() {
        const taggedResources = await TAG.getResources({
            tagsPerPage: 500,
            tagFilters: [{
                Key: this.tagKey,
                Values: [this.tagValue],
            }],
            resourceTypeFilters: config.RESOURCE_MAP,
        });

        this.resources = taggedResources.ResourceTagMappingList.map((res) => {
            const arn = res.ResourceARN;
            const tags = res.Tags;
            const actionable = getTagValue(tags, config.tags.SCC_ACTIONABLE) === 'true';
            const costLimit = parseInt((getTagValue(tags, config.tags.SCC_COST_LIMIT)), 10);

            // eslint-disable-next-line prefer-const
            let [,, service, region,, type, resourceId] = arn.split(':');

            if (service === 'dynamodb') {
                [type, resourceId] = type.split('/');
            }

            return new Resource({
                costLimit: Number.isNaN(costLimit) ? this.defaultCostLimit : costLimit,
                actionable,
                type,
                resourceId,
                service,
                arn,
                region,
            });
        });

        return this;
    }

    getResources(service, type) {
        const match = new RegExp(`^${type}`);
        return this.resources.filter(r => r.service === service && match.test(r.type));
    }

    getResource(service, resourceId) {
        return this.resources.find(r => r.service === service && r.resourceId === resourceId);
    }
};
