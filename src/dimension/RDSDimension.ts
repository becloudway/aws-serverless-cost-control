import { Dimension } from './Dimension';
import { rdsClient } from '../clients';
import {start} from "repl";

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

    public get storedGiBs(): number {
        return this._storedGiBs;
    }

    public get ioRequests(): number {
        return this._ioRequests;
    }
}
