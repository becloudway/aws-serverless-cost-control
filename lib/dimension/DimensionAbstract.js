"use strict";
/* eslint-disable class-methods-use-this */
Object.defineProperty(exports, "__esModule", { value: true });
class Dimension {
    constructor({ start = new Date(), end, resource }) {
        this.start = start;
        this.end = end;
        this.resource = resource;
    }
    async create() {
        throw new Error('Dimension.create must be implemented');
    }
}
exports.Dimension = Dimension;
;
//# sourceMappingURL=DimensionAbstract.js.map