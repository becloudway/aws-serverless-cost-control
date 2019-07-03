/* eslint-disable no-undef,object-curly-newline */
import * as AWS from 'aws-sdk';
import * as faker from 'faker';
import { PublishInput, PublishResponse } from 'aws-sdk/clients/sns';
import { SNSClient } from '../../src/clients';
import { regions } from '../../src/config';
import { buildResource } from '../_helpers/builders';
import { Resource } from '../../src/resource';

jest.mock('../../src/logger');

describe('SNSClient', () => {
    const awsSNS = new AWS.SNS({ apiVersion: '2010-03-31', region: regions.CURRENT_REGION });
    const client: SNSClient = new SNSClient(awsSNS);

    beforeAll(() => {
        this.publishMock = jest.fn();
        awsSNS.publish = this.publishMock;
    });

    afterEach(() => jest.resetAllMocks());
    afterAll(() => jest.restoreAllMocks());

    describe('#publish', () => {
        it('publishes a message to a topic', async () => {
            const topicArn = faker.random.word();
            const resource: Resource = buildResource({ actionable: true });
            const output: PublishResponse = { MessageId: faker.random.alphaNumeric(15) };
            const input: PublishInput = SNSClient.buildMessage(topicArn, resource);

            this.publishMock.mockImplementation((data: any, callback: Function) => callback(null, output));

            await expect(client.publish(topicArn, resource)).resolves.toEqual(output);
            expect(awsSNS.publish).toHaveBeenCalledTimes(1);
            expect(awsSNS.publish).toHaveBeenCalledWith(input, expect.any(Function));
        });
    });

    describe('#buildMessage.static', () => {
        it('builds a message for an actionable resource', () => {
            const topicArn = faker.random.word();
            const resource: Resource = buildResource({ actionable: true });
            const message: PublishInput = SNSClient.buildMessage(topicArn, resource);
            expect(message.Subject).toContain('throttling');
        });
        it('builds a message for a non-actionable resource', () => {
            const topicArn = faker.random.word();
            const resource: Resource = buildResource({ actionable: false });
            const message: PublishInput = SNSClient.buildMessage(topicArn, resource);
            expect(message.Subject).toContain('exceeded');
        });
    });
});
