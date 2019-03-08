import { Dimension } from './Dimension';
import { dynamodbClient } from '../clients';

export class DynamoDBDimension extends Dimension {
    private _readCapacityUnits: number = 0;

    private _writeCapacityUnits: number = 0;

    private _storageSizeBytes: number = 0;

    public async create(): Promise<DynamoDBDimension> {
        const table = await dynamodbClient.describeTable(this.resource.id);

        this._storageSizeBytes = table.Table.TableSizeBytes;
        this._readCapacityUnits = await dynamodbClient.getReadCapacityUnits(this.resource, this.start, this.end);
        this._writeCapacityUnits = await dynamodbClient.getReadCapacityUnits(this.resource, this.start, this.end);

        return this;
    }


    public get readCapacityUnits(): number {
        return this._readCapacityUnits;
    }

    public get writeCapacityUnits(): number {
        return this._writeCapacityUnits;
    }

    public get storageSizeBytes(): number {
        return this._storageSizeBytes;
    }
}
