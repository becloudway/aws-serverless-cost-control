import { Dimension } from './Dimension';
import { rdsClient } from '../clients';

export class RDSDimension extends Dimension {
    private _auroraCapacityUnits: number = 0;

    private _storedGiBs: number = 0;

    private _ioRequests: number = 0;

    public async create(): Promise<RDSDimension> {
        this._auroraCapacityUnits = await rdsClient.getACUs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this._storedGiBs = await rdsClient.getStoredGiBs({ start: this.start, end: this.end, clusterId: this.resource.id });
        this._ioRequests = (await rdsClient.getIoRequests({ start: this.start, end: this.end, clusterId: this.resource.id }));

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
