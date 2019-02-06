const SERVICE_RDS = 'rds';
const SERVICE_LAMBDA = 'lambda';
const SERVICE_DYNAMODB = 'dynamodb';
// const SERVICE_KINESIS = 'kinesis';
const RESOURCE_LAMBDA_FUNCTION = 'function';
const RESOURCE_RDS_CLUSTER_INSTANCE = 'cluster';
const RESOURCE_DYNAMODB_TABLE = 'table';
// const RESOURCE_STREAM = 'stream';

const REGION_MAP_CODE_TO_NAME = {
    'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)',
    'us-west-1': 'US West (N. California)',
    'us-west-2': 'US West (Oregon)',
    'ca-central-1': 'Canada (Central)',
    'eu-west-1': 'EU (Ireland)',
    'eu-west-2': 'EU (London)',
    'eu-west-3': 'EU (Paris)',
    'eu-central-1': 'EU (Frankfurt)',
    'ap-northeast-1': 'Asia Pacific (Tokyo)',
    'ap-northeast-2': 'Asia Pacific (Seoul)',
    'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-southeast-2': 'Asia Pacific (Sydney)',
    'sa-east-1': 'South America (Sao Paulo)',
    'ap-south-1': 'Asia Pacific (Mumbai)',
    'cn-northwest-1': 'China (Ningxia)',
};

module.exports = {
    SERVICE_LAMBDA,
    SERVICE_RDS,
    SERVICE_DYNAMODB,
    RESOURCE_LAMBDA_FUNCTION,
    RESOURCE_RDS_CLUSTER_INSTANCE,
    RESOURCE_DYNAMODB_TABLE,
    RESOURCE_MAP: [
        `${SERVICE_LAMBDA}:${RESOURCE_LAMBDA_FUNCTION}`,
        `${SERVICE_RDS}:${RESOURCE_RDS_CLUSTER_INSTANCE}`,
        `${SERVICE_DYNAMODB}:${RESOURCE_DYNAMODB_TABLE}`,
    ],
    metrics: {
        METRIC_WINDOW: 5,
        METRIC_DELAY: 1,
        NAME_SPACE: process.env.METRICS_NAMESPACE, // 'Cloudway/Serverless/PricingForecast',
        NAME_ESTIMATEDCHARGES: 'MonthlyEstimatedCharges',
        NAME_COST: 'Cost',
        DIMENSIONS: {
            SERVICE_NAME: 'ServiceName',
            RESOURCE_ID: 'RecourceId',
            WINDOW: 'window',
            CURRENCY: 'Currency',
            TAG: 'Tag',
            SERVICE_NAME_EC2: 'ec2',
            SERVICE_NAME_RDS: 'rds',
            SERVICE_NAME_LAMBDA: 'lambda',
            SERVICE_NAME_DYNAMODB: 'dynamodb',
            SERVICE_NAME_KINESIS: 'kinesis',
            SERVICE_NAME_TOTAL: 'total',
            CURRENCY_USD: 'USD',
        },
    },
    window: {
        MONTHLY: 730.48,
        HOURLY: 1,
        FIVE_MINUTES: '5min',
        PERIOD_MONTHLY: 'monthly',
        PERIOD_HOURLY: 'hourly',
        PERIOD_DEFAULT: 'monthly',
    },
    regions: {
        NAME: REGION_MAP_CODE_TO_NAME,
        CURRENT_REGION: process.env.AWS_REGION || 'eu-west-1',
        IRELAND: 'eu-west-1',
        NORTH_VIRGINIA: 'us-east-1',
    },
};
