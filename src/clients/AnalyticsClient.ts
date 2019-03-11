import * as AWS from 'aws-sdk';
import { readFileSync } from 'fs';
import {
    ApplicationDetail,
    CreateApplicationRequest,
    CreateApplicationResponse,
    DescribeApplicationResponse, JSONMappingParameters,
} from 'aws-sdk/clients/kinesisanalytics';
import { StreamDescription } from 'aws-sdk/clients/kinesis';
import { AWSClient } from './AWSClient';

const applicationCode = readFileSync(`${process.cwd()}/resources/random-cut-forest.sql`, { encoding: 'utf-8' });

export class AnalyticsClient extends AWSClient<AWS.KinesisAnalytics> {
    public static buildApplicationName(resourceId: string): string {
        return `${resourceId}-application`;
    }

    private getExistingApplication(resourceId: string): Promise<ApplicationDetail> {
        return new Promise((resolve, reject) => {
            this.client.describeApplication({
                ApplicationName: AnalyticsClient.buildApplicationName(resourceId),
            }, (err: Error, data: DescribeApplicationResponse) => resolve(data && data.ApplicationDetail));
        });
    }

    private async createApplication(resourceId: string, inputStream: StreamDescription): Promise<ApplicationDetail> {
        const params: CreateApplicationRequest = {
            ApplicationName: AnalyticsClient.buildApplicationName(resourceId),
            ApplicationCode: applicationCode,
            Inputs: [
                {
                    InputSchema: { /* required */
                        RecordColumns: [ /* required */
                            {
                                Name: 'cost', /* required */
                                SqlType: 'DOUBLE', /* required */
                                Mapping: '$.cost',
                            },
                        ],
                        RecordFormat: { /* required */
                            RecordFormatType: 'JSON',
                            MappingParameters: {
                                JSONMappingParameters: {
                                    RecordRowPath: '$',
                                },
                            },
                        },
                        RecordEncoding: 'UTF-8',
                    },
                    NamePrefix: 'SOURCE_SQL_STREAM', /* required */
                    KinesisStreamsInput: {
                        ResourceARN: inputStream.StreamARN, /* required */
                        RoleARN: process.env.KINESIS_ROLE, /* required */
                    },
                },
            ],
            Outputs: [
                {
                    DestinationSchema: {
                        RecordFormatType: 'JSON',
                    },
                    Name: 'DESTINATION_SQL_STREAM',
                    LambdaOutput: {
                        ResourceARN: process.env.ANOMALY_DETECTOR_LAMBDA_ARN,
                        RoleARN: process.env.KINESIS_ROLE,
                    },
                },
            ],
        };

        await new Promise((resolve, reject) => {
            this.client.createApplication(params, (err: Error, data: CreateApplicationResponse) => {
                if (err) console.error(err);
                resolve(data && data.ApplicationSummary);
            });
        });

        return this.getExistingApplication(resourceId);
    }

    public async createApplicationIfNotExists(resourceId: string, inputStream: StreamDescription): Promise<ApplicationDetail> {
        const application = await this.getExistingApplication(resourceId);
        if (!application) await this.createApplication(resourceId, inputStream);
        return application || this.getExistingApplication(resourceId);
    }
}
