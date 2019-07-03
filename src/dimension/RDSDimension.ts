import { Dimension } from './Dimension';
import { rdsClient } from '../clients';

export class RDSDimension extends Dimension {
    private _auroraCapacityUnits: number = 0;

    private _storedGiBs: number = 0;

    private _ioRequests: number = 0;

    public async create(): Promise<RDSDimension> {
        this._auroraCapacityUnits = await rdsClient.getACUs(this.resource.id, this.start, this.end);
        this._storedGiBs = await rdsClient.getStoredGiBs(this.resource.id, this.start, this.end);
        this._ioRequests = (await rdsClient.getIoRequests(this.resource.id, this.start, this.end));

        return this;
    }

    public get auroraCapacityUnits(): number {
        return this._auroraCapacityUnits;
    }

    public set auroraCapacityUnits(value: number) {
        this._auroraCapacityUnits = value;
    }

    public get storedGiBs(): number {
        return this._storedGiBs;
    }

    public set storedGiBs(value: number) {
        this._storedGiBs = value;
    }

    public get ioRequests(): number {
        return this._ioRequests;
    }

    public set ioRequests(value: number) {
        this._ioRequests = value;
    }
}
