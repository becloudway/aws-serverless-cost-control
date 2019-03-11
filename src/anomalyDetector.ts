import { KinesisStreamEvent } from 'aws-lambda';
import { log } from './logger';

export const handler = async (event: KinesisStreamEvent) => {
    log.info('Received event', JSON.stringify(event, null, 2));

    try {
        event.Records.forEach((r) => {
            log.info('stream record: ', r.kinesis.data);
        });

        return { status: 200 };
    } catch (e) {
        log.error('Something went wrong', e);
        return {
            status: 400,
            message: e.message,
        };
    }
};
