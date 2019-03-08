"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const resource_1 = require("./resource");
const clients_1 = require("./clients");
const getTagValue = (tags, key) => {
    const tag = tags.find(tagSet => tagSet.Key === key);
    return tag && tag.Value;
};
class ResourceManager {
    constructor(resourceTag) {
        this.resources = [];
        this.defaultCostLimit = 10;
        this.tagKey = resourceTag.key;
        this.tagValue = resourceTag.value;
    }
    async init() {
        const taggedResources = await clients_1.tagClient.getResources({
            tagsPerPage: 500,
            tagFilters: [{
                    Key: this.tagKey,
                    Values: [this.tagValue],
                }],
            resourceTypeFilters: config_1.RESOURCE_MAP,
        });
        this.resources = taggedResources.ResourceTagMappingList.map((res) => {
            const arn = res.ResourceARN;
            const tags = res.Tags;
            const actionable = getTagValue(tags, config_1.TAGS.SCC_ACTIONABLE) === 'true';
            const costLimit = parseInt((getTagValue(tags, config_1.TAGS.SCC_COST_LIMIT)), 10);
            // eslint-disable-next-line prefer-const
            let [, , service, region, , type, resourceId] = arn.split(':');
            if (service === 'dynamodb') {
                [type, resourceId] = type.split('/');
            }
            return new resource_1.Resource(service, resourceId, type, region, arn, actionable, Number.isNaN(costLimit) ? this.defaultCostLimit : costLimit);
        });
        return this;
    }
    getResources(service, type) {
        const match = new RegExp(`^${type}`);
        return this.resources.filter(r => r.service === service && match.test(r.type));
    }
    getResource(service, resourceId) {
        return this.resources.find(r => r.service === service && r.id === resourceId);
    }
}
exports.ResourceManager = ResourceManager;
//# sourceMappingURL=resourceManager.js.map