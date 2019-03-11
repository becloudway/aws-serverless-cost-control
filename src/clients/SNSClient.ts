import * as AWS from 'aws-sdk';
import { PublishInput, PublishResponse } from 'aws-sdk/clients/sns';
import { AWSClient } from './AWSClient';
import { Resource } from '../resource';

export class SNSClient extends AWSClient<AWS.SNS> {
    public publish(topicArn: string, resource: Resource): Promise<PublishResponse> {
        const params: PublishInput = {
            Subject: `We are throttling your AWS resource ${resource.id}`,
            Message: `One of your AWS resources seems to show a lot of activity and has exceeded its hard limit. <br><br>${JSON.stringify(resource)}`,
            TopicArn: topicArn,
            MessageAttributes: {
                resourceId: {
                    DataType: 'String',
                    StringValue: resource.id,
                },
                serviceName: {
                    DataType: 'String',
                    StringValue: resource.service,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.client.publish(params, (err: Error, data: PublishResponse) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
}
