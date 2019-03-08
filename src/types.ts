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
    group: string;
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
