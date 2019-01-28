module.exports = class Lambda {
    constructor(client) {
        this.client = client;
    }

    throttle(resource, allowedConcurrentExecutions = 1) {
        return new Promise((resolve, reject) => this.client.putFunctionConcurrency({
            FunctionName: resource.id,
            ReservedConcurrentExecutions: allowedConcurrentExecutions,
        }, (err) => {
            if (err) reject(err);
            resolve();
        }));
    }
};
