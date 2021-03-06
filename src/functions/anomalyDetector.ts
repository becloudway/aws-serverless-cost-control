import { cloudwatchClient } from '../clients';
import { log } from '../logger';
import {
    DeliveryStatus,
    KinesisCostRecordWithAnomalyScore,
    KinesisStreamInputEvent,
    LambdaOutput,
    RecordResponse,
} from '../types';

export const handler = async (event: KinesisStreamInputEvent): Promise<LambdaOutput> => {
    log.info('Received event', JSON.stringify(event, null, 2));

    try {
        const recordResponses: RecordResponse[] = await Promise.all(event.records.map(async (r) => {
            let costRecord: KinesisCostRecordWithAnomalyScore;

            try {
                if (!r.data) { throw new Error('No record data available'); }
                const costRecordString: string = Buffer.from(r.data, 'base64').toString('utf-8');
                costRecord = JSON.parse(costRecordString);

                await cloudwatchClient.putAnomalyMetricData(new Date(costRecord.recordTimestamp), costRecord.ANOMALY_SCORE);

                // TODO: do something if anomaly > 1

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
