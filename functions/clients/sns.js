module.exports = class SNS {
    constructor(client) {
        this.client = client;
    }

    publish({ topicArn, resource }) {
        const params = {
            Subject: `We are throttling your AWS resource ${resource.id}`,
            Message: `One of your AWS resources seems to show a lot of activity and has exceeded its hard limit. <br><br>${JSON.stringify(resource)}`,
            MessageStructure: 'json',
            TopicArn: topicArn,
            MessageAttributes: {
                resourceId: {
                    DataType: 'String',
                    StringValue: resource.id,
                },
                costLimit: {
                    DataType: 'Number',
                    StringValue: resource.costLimit,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.client.publish(params, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
};
