module.exports = class Tag {
    constructor(client) {
        this.client = client;
    }

    getResources({ tagsPerPage, tagFilters, resourceTypeFilters }) {
        return new Promise((resolve, reject) => this.client.getResources({
            TagsPerPage: tagsPerPage,
            TagFilters: tagFilters,
            ResourceTypeFilters: resourceTypeFilters,
        }, (err, data) => {
            if (err) reject(err);
            resolve(data);
        }));
    }
};
