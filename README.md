<h1 align="center">Welcome to aws-serverless-cost-control 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://travis-ci.org/becloudway/aws-serverless-cost-control">
  <img alt="Coverage" src="https://travis-ci.org/becloudway/aws-serverless-cost-control.svg?branch=master" />
  </a>
  <a href="https://codecov.io/gh/becloudway/aws-serverless-cost-control">
    <img src="https://codecov.io/gh/becloudway/aws-serverless-cost-control/branch/master/graph/badge.svg" />
  </a>
</p>

> Cloudformation Stack for keeping tabs on your serverless resources

### 🏠 [Homepage](https://github.com/becloudway/aws-serverless-cost-control)

## Install

```sh
npm install
```

## Usage

### Configuration

1. Deploy cloudformation stack (TODO: add button)

2. Provide the following parameters:
    *   `MetricNameSpace` (default: _Cloudway/Serverless/Monitoring_)
    *   `Environment` (default: _dev_)
    *   `ApplicationName` (default: _cloudway-scc_)
    *   `MonitorEmail`
    *   `IncludeTags`: if provided, only resources with given tags with value "true" will be included (comma separted list).
    *   `ExcludeTags`: exclude resources with given tag(s)


## Run tests

```sh
npm run test

# with coverage
npm run test:coverage
```

## Authors

👤 **Samuel Overloop**

* Github: [@samover](https://github.com/samover)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/becloudway/aws-serverless-cost-control/issues).

## Show your support

Give a ⭐️ if this project helped you!

