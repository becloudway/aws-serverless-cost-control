const DimensionAbstract = require('./DimensionAbstract');
const { DYNAMODB } = require('../clients');

module.exports = class DynamodbDimension extends DimensionAbstract {
    constructor({ start = new Date(), end, resource }) {
        super({ start, end, resource });
        this.readCapacityUnits = 0;
        this.writeCapacityUnits = 0;
        this.storageSizeBytes = 0;
    }

    async create() {
        const table = await DYNAMODB.describeTable(this.resource.id);

        this.storageSizeBytes = table.Table.TableSizeBytes;
        this.readCapacityUnits = await DYNAMODB.getReadCapacityUnits(this.resource, this.start, this.end);
        this.writeCapacityUnits = await DYNAMODB.getReadCapacityUnits(this.resource, this.start, this.end);

        return this;
    }
};
