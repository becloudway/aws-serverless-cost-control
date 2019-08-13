import { CloudwatchClient } from './CloudwatchClient';

export abstract class AWSClient<T> {
    protected client: T;
    protected clwClient: CloudwatchClient;

    public constructor(client: T, clwClient?: CloudwatchClient) {
        this.client = client;
        this.clwClient = clwClient;
    }
}

export const wrapCallbackVoid = <T>(caller: Function, params: T): Promise<void> => new Promise(
    (resolve, reject): Function => caller(params, (err: Error): void => {
        if (err) { reject(err); }
        resolve();
    }),
);

export const wrapCallback = <T, U>(caller: Function, params: T, dataResolver?: Function): Promise<U> => new Promise(
    (resolve, reject): Function => caller(params, (err: Error, data: U): void => {
        if (err) { reject(err); }
        resolve(dataResolver ? dataResolver(data) : data);
    }),
);
