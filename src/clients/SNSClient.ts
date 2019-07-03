import * as AWS from 'aws-sdk';
import { PublishInput, PublishResponse } from 'aws-sdk/clients/sns';
import { AWSClient, wrapCallback } from './AWSClient';
import { Resource } from '../resource';

export class SNSClient extends AWSClient<AWS.SNS> {
    public static buildMessage(topicArn: string, resource: Resource): PublishInput {
        const subject = resource.actionable
            ? `We are throttling your AWS resource ${resource.id}`
            : `AWS resource ${resource.id} has exceeded hard limit`;

        return {
            Subject: subject,
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
                actionable: {
                    DataType: 'String',
                    StringValue: `${resource.actionable}`,
                },
            },
        };
    }

    public publish(topicArn: string, resource: Resource): Promise<PublishResponse> {
        return wrapCallback<PublishInput, PublishResponse>(this.client.publish, SNSClient.buildMessage(topicArn, resource));
    }
}
