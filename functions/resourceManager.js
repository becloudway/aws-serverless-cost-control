const config = require('./config');
const { TAG } = require('./clients');
const Resource = require('./resource');

module.exports = class ResourceManager {
    constructor({ tagKey, tagValue }) {
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
            // eslint-disable-next-line prefer-const
            let [,, service, region,, type, resourceId] = arn.split(':');

            if (service === 'dynamodb') {
                [type, resourceId] = type.split('/');
            }

            return new Resource({
                type, resourceId, service, arn, region,
            });
        });

        return this;
    }

    getResources(service, type) {
        const match = new RegExp(`^${type}`);
        return this.resources.filter(r => r.service === service && match.test(r.type));
    }
};
