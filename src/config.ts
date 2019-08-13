import { ObjectIndexer } from './types';
import { Strings } from './utils';

const SERVICE_RDS = 'rds';
const SERVICE_LAMBDA = 'lambda';
const SERVICE_DYNAMODB = 'dynamodb';
const RESOURCE_LAMBDA_FUNCTION = 'function';
const RESOURCE_RDS_CLUSTER_INSTANCE = 'cluster';
const RESOURCE_DYNAMODB_TABLE = 'table';

const REGION_MAP_CODE_TO_NAME: ObjectIndexer<string> = {
    'ap-northeast-1': 'Asia Pacific (Tokyo)',
    'ap-northeast-2': 'Asia Pacific (Seoul)',
    'ap-south-1': 'Asia Pacific (Mumbai)',
    'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-southeast-2': 'Asia Pacific (Sydney)',
    'ca-central-1': 'Canada (Central)',
    'cn-northwest-1': 'China (Ningxia)',
    'eu-central-1': 'EU (Frankfurt)',
    'eu-west-1': 'EU (Ireland)',
    'eu-west-2': 'EU (London)',
    'eu-west-3': 'EU (Paris)',
    'sa-east-1': 'South America (Sao Paulo)',
    'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)',
    'us-west-1': 'US West (N. California)',
    'us-west-2': 'US West (Oregon)',
};

const TAGS = {
    EXCLUDE_TAGS: Strings.parseList(process.env.EXCLUDE_TAGS || ''),
    INCLUDE_TAGS: Strings.parseList(process.env.INCLUDE_TAGS || ''),
    SCC_ACTIONABLE: 'scc-actionable',
    SCC_COST_LIMIT: 'scc-cost-limit',
};

const RESOURCE_MAP = [
    `${SERVICE_LAMBDA}:${RESOURCE_LAMBDA_FUNCTION}`,
    `${SERVICE_RDS}:${RESOURCE_RDS_CLUSTER_INSTANCE}`,
    `${SERVICE_DYNAMODB}:${RESOURCE_DYNAMODB_TABLE}`,
];

const metrics = {
    DIMENSIONS: {
        CURRENCY: 'Currency',
        CURRENCY_USD: 'USD',
        RESOURCE_ID: 'ResourceId',
        SERVICE_NAME: 'ServiceName',
        SERVICE_NAME_DYNAMODB: 'dynamodb',
        SERVICE_NAME_EC2: 'ec2',
        SERVICE_NAME_KINESIS: 'kinesis',
        SERVICE_NAME_LAMBDA: 'lambda',
        SERVICE_NAME_RDS: 'rds',
        SERVICE_NAME_TOTAL: 'total',
        TAG: 'Tag',
        WINDOW: 'window',
    },
    METRIC_DELAY: 1,
    METRIC_WINDOW: 5,
    NAME_ANOMALY_SCORE: 'AnomalyScore',
    NAME_COST: 'Cost',
    NAME_ESTIMATEDCHARGES: 'MonthlyEstimatedCharges',
    NAME_SPACE: process.env.METRICS_NAMESPACE || 'Cloudway/Serverless/PricingForecast',
};

const window = {
    FIVE_MINUTES: '5min',
    HOURLY: 1,
    MONTHLY: 730.48,
    PERIOD_DEFAULT: 'monthly',
    PERIOD_HOURLY: 'hourly',
    PERIOD_MONTHLY: 'monthly',
};

const regions = {
    CURRENT_REGION: process.env.AWS_REGION || 'eu-west-1',
    NAME: REGION_MAP_CODE_TO_NAME,
    NORTH_VIRGINIA: 'us-east-1',
};

export {
    SERVICE_LAMBDA,
    SERVICE_RDS,
    SERVICE_DYNAMODB,
    RESOURCE_LAMBDA_FUNCTION,
    RESOURCE_RDS_CLUSTER_INSTANCE,
    RESOURCE_DYNAMODB_TABLE,
    RESOURCE_MAP,
    metrics,
    window,
    regions,
    TAGS,
};
