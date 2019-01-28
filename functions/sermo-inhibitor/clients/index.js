const AWS = require('aws-sdk');
const config = require('../config');
const Lambda = require('./lambda');
const Tag = require('./tag');

const { CURRENT_REGION: REGION } = config.regions;
const tagClient = new Tag(new AWS.ResourceGroupsTaggingAPI({ apiVersion: '2017-01-26', region: REGION }));
const lambdaClient = new Lambda(new AWS.Lambda({ apiVersion: '2015-03-31', region: REGION }));

module.exports = {
    TAG: tagClient,
    LAMBDA: lambdaClient,
};
