import {
    CreateStreamInput,
    DescribeStreamInput,
    DescribeStreamOutput,
    PutRecordInput,
    StreamDescription,
} from 'aws-sdk/clients/kinesis';
import { AWSClient, wrapCallback, wrapCallbackVoid } from './AWSClient';

export class KinesisClient extends AWSClient<AWS.Kinesis> {
    public static buildStreamName(resourceId: string): string {
        return `${resourceId}-stream`;
    }

    private getExistingStream(resourceId: string): Promise<StreamDescription> {
        return wrapCallback<DescribeStreamInput, StreamDescription>(this.client.describeStream.bind(this.client), {
            StreamName: KinesisClient.buildStreamName(resourceId),
        }, (data: DescribeStreamOutput) => data && data.StreamDescription);
    }

    private createStream(resourceId: string): Promise<void> {
        return wrapCallbackVoid<CreateStreamInput>(this.client.createStream.bind(this.client), {
            ShardCount: 1,
            StreamName: KinesisClient.buildStreamName(resourceId),
        });
    }

    public async createStreamIfNotExists(resourceId: string): Promise<StreamDescription> {
        const stream: StreamDescription = await this.getExistingStream(resourceId);
        if (!stream) await this.createStream(resourceId);
        return stream || this.getExistingStream(resourceId);
    }

    public async putRecord<T>(streamName: string, record: T): Promise<void> {
        return wrapCallbackVoid<PutRecordInput>(this.client.putRecord.bind(this.client), {
            StreamName: streamName,
            PartitionKey: 'partitionKey', // streams only have one shard, so partitionkey is not relevant
            Data: JSON.stringify(record),
        });
    }
}
