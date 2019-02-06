/* eslint-disable class-methods-use-this */

module.exports = class DimensionAbstract {
    constructor({ start = new Date(), end, resource }) {
        this.start = start;
        this.end = end;
        this.resource = resource;
    }

    async create() {
        throw new Error('Dimension.create must be implemented');
    }
};
