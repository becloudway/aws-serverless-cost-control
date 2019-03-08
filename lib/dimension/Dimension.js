"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dimension {
    constructor(resource, start, end) {
        this._start = start;
        this._end = end;
        this._resource = resource;
    }
    get start() {
        return this._start;
    }
    get end() {
        return this._end;
    }
    get resource() {
        return this._resource;
    }
}
exports.Dimension = Dimension;
//# sourceMappingURL=Dimension.js.map