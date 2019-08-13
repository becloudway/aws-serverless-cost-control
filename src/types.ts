export interface AWSTag {
    Key: string;
    Value: string;
}

export interface ResourceTag {
    key: string;
    value: string;
}

export interface TagFilter {
    key: string;
    values: string[];
}

export interface PricingResult {
    currency: string;
    estimatedMonthlyCharge: number;
    totalCostWindowSeconds: number;
    totalCost: number;
    breakdown: any;
}

export interface ProductPricing {
    version: string;
    group?: string;
    pricePerUnit: number;
    unit: string;
}

export interface ObjectIndexer<T> {
    [id: string]: T;
}

export interface DateRange {
    start: Date;
    end: Date;
}

export interface KinesisCostRecord {
    cost: number;
    timestamp: Date;
}

export enum MetricStatistic {
    Average,
    Count,
    Samplecount,
    Sum,
    Minimum,
    Maximum,
}

export interface LambdaResponse {
    status: number;
    message?: string;
}

export interface LambdaDeliveryRecordMetadata {
    retryHint: number;
}

export interface KinesisStreamRecord {
    recordId: string;
    lambdaDeliveryRecordMetadata: LambdaDeliveryRecordMetadata;
    data: string;
}

export interface KinesisStreamInputEvent {
    invocationId: string;
    applicationArn: string;
    records: KinesisStreamRecord[];
}

export interface RecordResponse {
    recordId: string;
    result: DeliveryStatus;
}

export interface LambdaOutput {
    records: RecordResponse[];
}

export enum DeliveryStatus {
    Ok,
    DeliveryFailed,
}

export interface KinesisCostRecordWithAnomalyScore extends KinesisCostRecord {
    recordTimestamp: Date;
    resourceId: string;
    service: string;
    ANOMALY_SCORE: number;
}

export interface PriceDimensionJson {
    unit: string;
    endRange: string;
    description: string;
    appliesTo: string[];
    rateCode: string;
    beginRange: string;
    pricePerUnit: {
        USD: string;
    };
}

export interface ProductPricingJson {
    product: {
        productFamily: string;
        attributes: {
            [key: string]: string;
        };
        sku: string;
    };
    serviceCode: string;
    terms: {
        [key: string]: {
            [key: string]: {
                priceDimensions: {
                    [key: string]: PriceDimensionJson;
                };
                sku: string;
                effectiveDate: string;
                offerTermCode: string;
                termAttributes: object;
            };
        };
    };
    version: string;
    publicationDate: string;
}
