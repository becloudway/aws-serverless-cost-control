const { differenceInSeconds } = require('date-fns');
const config = require('../config');
const { RDS } = require('../clients');
const log = require('../logger');

const getForecastFactor = (start, end, forecastPeriod) => {
    const diffHours = 3600 / differenceInSeconds(end, start);
    return diffHours * forecastPeriod;
};

module.exports = class RdsDimension {
    constructor({ start = new Date(), end, rdsCluster }) {
        this.start = start;
        this.end = end;
        this.cluster = rdsCluster;
        this.auroraCapacityUnits = 0;
        this.storedGiBs = 0;
        this.ioRequests = 0;
    }

    async create() {
        this.auroraCapacityUnits = await RDS.getACUs({ start: this.start, end: this.end, clusterId: this.cluster.id });
        this.storedGiBs = await RDS.getStoredGiBs({ start: this.start, end: this.end, clusterId: this.cluster.id });
        this.ioRequests = (await RDS.getIoRequests({ start: this.start, end: this.end, clusterId: this.cluster.id }));

        return this;
    }
};
