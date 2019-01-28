// const SERVICE_EC2 = 'ec2';
// const SERVICE_RDS = 'rds';
// const SERVICE_ELB = 'elasticloadbalancing';
const SERVICE_LAMBDA = 'lambda';
// const SERVICE_DYNAMODB = 'dynamodb';
// const SERVICE_KINESIS = 'kinesis';
const RESOURCE_LAMBDA_FUNCTION = 'function';
// const RESOURCE_ELB = 'loadbalancer';
// const RESOURCE_ALB = 'loadbalancer/app';
// const RESOURCE_NLB = 'loadbalancer/net';
// const RESOURCE_EC2_INSTANCE = 'instance';
// const RESOURCE_RDS_DB_INSTANCE = 'db';
// const RESOURCE_EBS_VOLUME = 'volume';
// const RESOURCE_EBS_SNAPSHOT = 'snapshot';
// const RESOURCE_DDB_TABLE = 'table';
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
    RESOURCE_LAMBDA_FUNCTION,
    RESOURCE_MAP: [
        `${SERVICE_LAMBDA}:${RESOURCE_LAMBDA_FUNCTION}`,
    ],
    metrics: {
        METRIC_WINDOW: 5,
        METRIC_DELAY: 0,
        NAME_SPACE: 'Cloudway/Serverless/PricingForecast',
        NAME_ESTIMATEDCHARGES: 'EstimatedCharges',
        DIMENSIONS: {
            SERVICE_NAME: 'ServiceName',
            RESOURCE_ID: 'RecourceId',
            PERIOD: 'ForecastPeriod',
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
    forecast: {
        MONTHLY: 730.48,
        HOURLY: 1,
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
