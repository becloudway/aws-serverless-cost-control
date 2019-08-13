export class Resource {
    private _service: string;
    private _type: string;
    private _id: string;
    private _arn: string;
    private _region: string;
    private _actionable: boolean;
    private _costLimit: number;
    private _resourceId: string;

    public constructor(
        service: string,
        resourceId: string,
        type?: string,
        region?: string,
        arn?: string,
        actionable?: boolean,
        costLimit?: number,
    ) {
        this._service = service;
        this._type = type;
        this._id = resourceId;
        this._arn = arn;
        this._region = region;
        this._actionable = actionable;
        this._costLimit = costLimit;
        this._resourceId = resourceId;
    }

    public get service(): string {
        return this._service;
    }

    public get type(): string {
        return this._type;
    }

    public get id(): string {
        return this._id;
    }

    public get arn(): string {
        return this._arn;
    }

    public get region(): string {
        return this._region;
    }

    public get actionable(): boolean {
        return this._actionable;
    }

    public get costLimit(): number {
        return this._costLimit;
    }

    public get resourceId(): string {
        return this._resourceId;
    }
}
