const DimensionAbstract = require('./DimensionAbstract');
const { RDS } = require('../clients');

module.exports = class RdsDimension extends DimensionAbstract {
    constructor({ start = new Date(), end, resource }) {
        super({ start, end, resource });
        this.auroraCapacityUnits = 0;
        this.storedGiBs = 0;
        this.ioRequests = 0;
    }

    async create() {
        this.auroraCapacityUnits = await RDS.getACUs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this.storedGiBs = await RDS.getStoredGiBs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this.ioRequests = (await RDS.getIoRequests({ start: this.start, end: this.end, clusterId: this.resource.id }));

        return this;
    }
};
