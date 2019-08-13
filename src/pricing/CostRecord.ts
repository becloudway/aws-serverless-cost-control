/* eslint-disable @typescript-eslint/interface-name-prefix */
import {
    DynamoDBPricing, LambdaPricing, Pricing, RDSPricing,
} from '.';
import { SERVICE_DYNAMODB, SERVICE_LAMBDA, SERVICE_RDS } from '../config';
import {
    Dimension, DynamoDBDimension, LambdaDimension, RDSDimension,
} from '../dimension';
import { log } from '../logger';
import { Resource } from '../resource';
import { DateRange, PricingResult } from '../types';

const pricings = new Map<string, new() => Pricing>();
pricings.set(SERVICE_DYNAMODB, DynamoDBPricing);
pricings.set(SERVICE_LAMBDA, LambdaPricing);
pricings.set(SERVICE_RDS, RDSPricing);

const dimensions = new Map<string, new(...params: any[]) => Dimension>();
dimensions.set(SERVICE_DYNAMODB, DynamoDBDimension);
dimensions.set(SERVICE_LAMBDA, LambdaDimension);
dimensions.set(SERVICE_RDS, RDSDimension);

type IPricing = new() => Pricing;

type IDimension = new(...params: any[]) => Dimension;

export class CostRecord {
    private _resource: Resource;
    private Pricing: IPricing;
    private Dimension: IDimension;
    private _pricing: PricingResult;

    public constructor(resource: Resource, pricing?: IPricing, dimension?: IDimension) {
        this._resource = resource;
        this.Pricing = pricing || pricings.get(resource.service);
        this.Dimension = dimension || dimensions.get(resource.service);
    }

    public async fetch({ start, end }: DateRange): Promise<CostRecord> {
        const costDimension: Dimension = await new this.Dimension(this._resource, start, end).create();
        const pricingScheme: Pricing = await new this.Pricing().init();
        this._pricing = pricingScheme.calculateForDimension(costDimension);

        log.info(`Cost record for ${this.resource.service.toUpperCase()}`, this.resource.id, this.pricing);

        return this;
    }


    public get resource(): Resource {
        return this._resource;
    }

    public get pricing(): PricingResult {
        return this._pricing;
    }
}
