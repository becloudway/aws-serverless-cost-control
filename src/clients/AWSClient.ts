import { CloudwatchClient } from './CloudwatchClient';

export abstract class AWSClient {
    protected client: any;

    protected clwClient: CloudwatchClient;

    public constructor(client: any, clwClient?: CloudwatchClient) {
        this.client = client;
        this.clwClient = clwClient;
    }
}
