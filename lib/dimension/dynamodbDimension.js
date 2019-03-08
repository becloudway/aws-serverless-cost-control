"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dimension_1 = require("./Dimension");
const clients_1 = require("../clients");
class DynamoDBDimension extends Dimension_1.Dimension {
    constructor() {
        super(...arguments);
        this._readCapacityUnits = 0;
        this._writeCapacityUnits = 0;
        this._storageSizeBytes = 0;
    }
    async create() {
        const table = await clients_1.dynamodbClient.describeTable(this.resource.id);
        this._storageSizeBytes = table.Table.TableSizeBytes;
        this._readCapacityUnits = await clients_1.dynamodbClient.getReadCapacityUnits(this.resource, this.start, this.end);
        this._writeCapacityUnits = await clients_1.dynamodbClient.getReadCapacityUnits(this.resource, this.start, this.end);
        return this;
    }
    get readCapacityUnits() {
        return this._readCapacityUnits;
    }
    get writeCapacityUnits() {
        return this._writeCapacityUnits;
    }
    get storageSizeBytes() {
        return this._storageSizeBytes;
    }
}
exports.DynamoDBDimension = DynamoDBDimension;
//# sourceMappingURL=dynamodbDimension.js.map