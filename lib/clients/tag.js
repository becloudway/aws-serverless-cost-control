"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWSClient_1 = require("./AWSClient");
class Tag extends AWSClient_1.AWSClient {
    getResources({ tagsPerPage, tagFilters, resourceTypeFilters }) {
        return new Promise((resolve, reject) => this.client.getResources({
            TagsPerPage: tagsPerPage,
            TagFilters: tagFilters,
            ResourceTypeFilters: resourceTypeFilters,
        }, (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        }));
    }
}
exports.Tag = Tag;
//# sourceMappingURL=tag.js.map