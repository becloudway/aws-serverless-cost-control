import * as AWS from 'aws-sdk';
import { PublishInput, PublishResponse } from 'aws-sdk/clients/sns';
import { Resource } from '../resource';
import { AWSClient, wrapCallback } from './AWSClient';

export class SNSClient extends AWSClient<AWS.SNS> {
    public static buildMessage(topicArn: string, resource: Resource): PublishInput {
        const subject = resource.actionable
            ? `We are throttling your AWS resource ${resource.id}`
            : `AWS resource ${resource.id} has exceeded hard limit`;

        return {
            Message: `One of your AWS resources seems to show a lot of activity and has exceeded its hard limit. <br><br>${JSON.stringify(resource)}`,
            MessageAttributes: {
                actionable: {
                    DataType: 'String',
                    StringValue: `${resource.actionable}`,
                },
                resourceId: {
                    DataType: 'String',
                    StringValue: resource.id,
                },
                serviceName: {
                    DataType: 'String',
                    StringValue: resource.service,
                },
            },
            Subject: subject,
            TopicArn: topicArn,
        };
    }

    public publish(topicArn: string, resource: Resource): Promise<PublishResponse> {
        return wrapCallback<PublishInput, PublishResponse>(this.client.publish.bind(this.client), SNSClient.buildMessage(topicArn, resource));
    }
}
