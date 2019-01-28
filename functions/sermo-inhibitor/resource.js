module.exports = class Resource {
    constructor({
        service,
        type,
        resourceId,
        region,
        arn,
    }) {
        this.service = service;
        this.type = type;
        this.id = resourceId;
        this.arn = arn;
        this.region = region;
    }
};
