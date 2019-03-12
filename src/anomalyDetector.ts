import { log } from './logger';
import { cloudwatchClient } from './clients';
import { metrics } from './config';
import { KinesisCostRecord, MetricStatistic } from './types';

interface LambdaDeliveryRecordMetadata {
    retryHint: number;
}

interface KinesisStreamRecord {
    recordId: string;
    lambdaDeliveryRecordMetadata: LambdaDeliveryRecordMetadata;
    data: string;
}

interface KinesisStreamInputEvent {
    invocationId: string;
    applicationArn: string;
    records: KinesisStreamRecord[];
}

interface RecordResponse {
    recordId: string;
    result: DeliveryStatus;
}

interface LambdaOutput {
    records: RecordResponse[];
}

enum DeliveryStatus {
    Ok,
    DeliveryFailed,
}

interface KinesisCostRecordWithAnomalyScore extends KinesisCostRecord {
    ANOMALY_SCORE: number;
}

export const handler = async (event: KinesisStreamInputEvent): Promise<LambdaOutput> => {
    try {
        const recordResponses: RecordResponse[] = await Promise.all(event.records.map(async (r) => {
            let costRecord: KinesisCostRecordWithAnomalyScore;

            try {
                const costRecordString: string = Buffer.from(r.data, 'base64').toString('utf-8');
                if (!costRecordString) throw new Error('No record data available');
                costRecord = JSON.parse(costRecordString);

                log.info('Received enriched costRecord', costRecord);

                await cloudwatchClient.putMetricData({
                    metricName: metrics.NAME_ANOMALY_SCORE,
                    service: costRecord.service,
                    value: costRecord.ANOMALY_SCORE,
                    resourceId: costRecord.resourceId,
                    timestamp: costRecord.timestamp,
                    unit: MetricStatistic.Average,
                });

                return {
                    recordId: r.recordId,
                    result: DeliveryStatus.Ok,
                };
            } catch (e) {
                log.error('Parsing record data failed', e);
                return {
                    recordId: r.recordId,
                    result: DeliveryStatus.DeliveryFailed,
                };
            }
        }));

        return { records: recordResponses };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            records: [],
        };
    }
};