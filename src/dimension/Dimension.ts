import { Resource } from '../resource';

export abstract class Dimension {
    private _start: Date;

    private _end: Date;

    private _resource: Resource;

    public constructor(resource: Resource, start: Date, end: Date) {
        this._start = start;
        this._end = end;
        this._resource = resource;
    }

    abstract async create(): Promise<Dimension>;

    public get start(): Date {
        return this._start;
    }

    public get end(): Date {
        return this._end;
    }

    public get resource(): Resource {
        return this._resource;
    }
}
