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

module.exports = {
    SERVICE_LAMBDA,
    RESOURCE_LAMBDA_FUNCTION,
    RESOURCE_MAP: [
        `${SERVICE_LAMBDA}:${RESOURCE_LAMBDA_FUNCTION}`,
    ],
    metrics: {
        METRIC_WINDOW: 5,
        METRIC_DELAY: 10,
    },
};
