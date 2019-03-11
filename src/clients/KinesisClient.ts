import * as AWS from 'aws-sdk';
import { DescribeStreamOutput, StreamDescription } from 'aws-sdk/clients/kinesis';
import { AWSClient } from './AWSClient';

export class KinesisClient extends AWSClient<AWS.Kinesis> {
    public static buildStreamName(resourceId: string): string {
        return `${resourceId}-stream`;
    }

    private getExistingStream(resourceId: string): Promise<StreamDescription> {
        return new Promise((resolve, reject) => {
            this.client.describeStream({
                StreamName: KinesisClient.buildStreamName(resourceId),
            }, (err: Error, data: DescribeStreamOutput) => {
                resolve(data && data.StreamDescription);
            });
        });
    }

    private createStream(resourceId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.createStream({
                ShardCount: 1,
                StreamName: KinesisClient.buildStreamName(resourceId),
            }, (err: Error) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    public async createStreamIfNotExists(resourceId: string): Promise<StreamDescription> {
        const stream: StreamDescription = await this.getExistingStream(resourceId);
        if (!stream) await this.createStream(resourceId);
        return stream || this.getExistingStream(resourceId);
    }

    public async putRecord<T>(streamName: string, record: T): Promise<void> {
        console.info("StreamName", streamName);
        console.info("record: ", record);
        return new Promise((resolve, reject) => {
            this.client.putRecord({
                StreamName: streamName,
                PartitionKey: 'partitionKey', // streams only have one shard, so partitionkey is not relevant
                Data: JSON.stringify(record),
            }, (err: Error) => {
                console.error("putRecord error:", err);
                if (err) reject(err);
                resolve();
            });
        });
    }
}
