"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dimension_1 = require("./Dimension");
const clients_1 = require("../clients");
class RDSDimension extends Dimension_1.Dimension {
    constructor() {
        super(...arguments);
        this._auroraCapacityUnits = 0;
        this._storedGiBs = 0;
        this._ioRequests = 0;
    }
    async create() {
        this._auroraCapacityUnits = await clients_1.rdsClient.getACUs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this._storedGiBs = await clients_1.rdsClient.getStoredGiBs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this._ioRequests = (await clients_1.rdsClient.getIoRequests({ start: this.start, end: this.end, clusterId: this.resource.id }));
        return this;
    }
    get auroraCapacityUnits() {
        return this._auroraCapacityUnits;
    }
    get storedGiBs() {
        return this._storedGiBs;
    }
    get ioRequests() {
        return this._ioRequests;
    }
}
exports.RDSDimension = RDSDimension;
//# sourceMappingURL=rdsDimension.js.map