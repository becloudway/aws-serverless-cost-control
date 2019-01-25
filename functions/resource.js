module.exports = class Resource {
    constructor({
        service,
        type,
        resourceId,
        arn,
    }) {
        this.service = service;
        this.type = type;
        this.id = resourceId;
        this.arn = arn;
    }
};
