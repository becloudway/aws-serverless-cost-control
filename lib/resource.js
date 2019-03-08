"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Resource {
    constructor(service, resourceId, type, region, arn, actionable, costLimit) {
        this._service = service;
        this._type = type;
        this._id = resourceId;
        this._arn = arn;
        this._region = region;
        this._actionable = actionable;
        this._costLimit = costLimit;
        this._resourceId = resourceId;
    }
    get service() {
        return this._service;
    }
    get type() {
        return this._type;
    }
    get id() {
        return this._id;
    }
    get arn() {
        return this._arn;
    }
    get region() {
        return this._region;
    }
    get actionable() {
        return this._actionable;
    }
    get costLimit() {
        return this._costLimit;
    }
    get resourceId() {
        return this._resourceId;
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map