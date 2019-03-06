module.exports = class Resource {
    constructor({
        service,
        type,
        resourceId,
        region,
        arn,
        actionable,
        costLimit,
    }) {
        this.service = service;
        this.type = type;
        this.id = resourceId;
        this.arn = arn;
        this.region = region;
        this.actionable = actionable;
        this.costLimit = costLimit;
    }
};
