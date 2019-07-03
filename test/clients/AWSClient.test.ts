/* eslint-disable no-undef */
import { AWSClient } from '../../src/clients/AWSClient';
import { CloudwatchClient, cloudwatchClient } from '../../src/clients';

class MockClient {}
class AWSClientImpl extends AWSClient<MockClient> {
    public getClient(): MockClient {
        return this.client;
    }

    public getClwClient(): CloudwatchClient {
        return this.clwClient;
    }
}

describe('#AWSClient.AbstractClass', () => {
    it('constructor requires a client', () => {
        const client = new MockClient();
        const awsClient = new AWSClientImpl(new MockClient());
        expect(awsClient.getClient()).toEqual(client);
    });

    it('constructor takes an optional cloudwatch client', () => {
        const client = new MockClient();
        const awsClient = new AWSClientImpl(new MockClient(), cloudwatchClient);
        expect(awsClient.getClwClient()).toEqual(cloudwatchClient);
    });
});
