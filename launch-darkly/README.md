# Akamai & LaunchDarkly Custom Feature Store Implementation

## Overview

This project implements a custom feature store for Akamai EdgeWorkers using LaunchDarkly's SDK. It's based on [LaunchDarkly's example repository](https://github.com/launchdarkly/js-core/tree/main/packages/sdk/akamai-base/example).

**Note:** While most customers use Akamai EdgeKV and the Akamai integration, this implementation demonstrates how to use the LaunchDarkly Akamai SDK with your own feature store.

## Use Case

This implementation extracts information from JWT claims to build a context for LaunchDarkly's SDK. The context is then used to validate flags against all available flags at `https://sdk.launchdarkly.com/sdk/latest-all`.
Building the context from JWT claims is only an example. The source of the data for the context can be different.

## Prerequisites

1. Akamai EdgeWorker ID (EW TIER 200 recommended) configured in an Akamai Property
2. LaunchDarkly SDK key
3. Akamai Property with LaunchDarkly's endpoint (`https://sdk.launchdarkly.com/sdk/latest-all`) configured as an origin
4. [Akamai CLI](https://github.com/akamai/cli) installed
5. [Akamai EdgeWorkers CLI](https://github.com/akamai/cli-edgeworkers) package installed
6. [Akamai API credentials](https://techdocs.akamai.com/developer/docs/set-up-authentication-credentials) set up

## Installation

1. Clone this repository:
   ```shell
   git clone [your-repo-url]
   cd [your-repo-name]
   ```

2. Install dependencies:
   ```shell
   npm install
   ```

## Configuration

### Modifying package.json

The `package.json` file contains important configuration settings for your EdgeWorker. You may need to modify these settings based on your specific deployment requirements. Here are the key fields you might need to update:

1. Open `package.json` in your project root.

2. Locate the `config` section:

   ```json
   "config": {
     "ewid": "12345",
     "bundleDescription": "Akamai & LaunchDarkly Demo",
     "network": "staging"
   }
   ```

3. Modify the following fields as needed:
   - `ewid`: Your EdgeWorker ID
   - `bundleDescription`: A brief description of your EdgeWorker
   - `network`: The network you're deploying to (e.g., "staging" or "production")

4. You can also update the version of your EdgeWorker by modifying the `version` field at the top of the `package.json` file:

   ```json
   "version": "0.0.1"
   ```

   Increment this version number when you make changes to your EdgeWorker.

5. Save the `package.json` file after making your changes.

These settings are used by the npm scripts defined in `package.json` for building, uploading, and activating your EdgeWorker. Ensuring these values are correct is crucial for successful deployment.

### Modifying EdgeWorker Code

1. Open `src/main.ts` and modify the following constants if needed:
   - `LD_ALL_FLAGS_URL`: LaunchDarkly's endpoint for retrieving all flags
   - `LD_FLAG_KEY`: The key of the feature flag you want to evaluate

2. Ensure your Akamai Property has the necessary configurations:
   - EdgeWorker ID assigned
   - LaunchDarkly's endpoint configured as an origin

## Development

Modify the code in `src/main.ts` as needed. The main logic is in the `onClientRequest` function, which:
1. Extracts JWT claims from the Authorization header
2. Creates a LaunchDarkly context based on these claims
3. Evaluates the specified feature flag
4. Routes the request based on the flag's value

## Deployment

To transpile the code, create the bundle, and update the EdgeWorker:

```shell
npm run deploy
```

This command will:
1. Transpile TypeScript to JavaScript
2. Bundle the code and dependencies
3. Create a tarball for deployment
4. Upload the bundle to your specified EdgeWorker ID
5. Activate the EW ID

