"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
class TagClient extends AWSClient_1.AWSClient {
    getResources({ tagsPerPage, tagFilters, resourceTypeFilters }) {
        const params = {
            TagsPerPage: tagsPerPage,
            TagFilters: tagFilters,
            ResourceTypeFilters: resourceTypeFilters,
        };
        return new Promise((resolve, reject) => this.client.getResources(params, (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        }));
    }
}
exports.TagClient = TagClient;
//# sourceMappingURL=TagClient.js.map