import { logger } from 'log';
import { httpRequest } from 'http-request';
import { base64url } from 'encoding';
import { EdgeProvider, init, LDContext } from '@launchdarkly/akamai-server-base-sdk';


// Constants for LaunchDarkly configuration
const LD_ALL_FLAGS_URL = 'https://sdk.launchdarkly.demo.com/sdk/latest-all';  // URL to fetch all flags (must be Akamaized)
const LD_FLAG_KEY = 'test-flag'  // Key of the feature flag to evaluate

// Custom FeatureStore class implementing EdgeProvider interface
class FeatureStore implements EdgeProvider {
  private sdkKey: string;

  constructor(sdkKey: string) {
    this.sdkKey = sdkKey;
  }

  // Method to fetch all flags from LaunchDarkly
  async get(_rootKey: string): Promise<string> {
    // Fetch flags from LaunchDarkly's endpoint
    const response = await httpRequest(LD_ALL_FLAGS_URL, {
      method: 'GET',
      headers: {
        Authorization: this.sdkKey,
      },
    });
    const flagData = await response.text();
    return flagData
  }
}

// Function to evaluate a flag using the custom FeatureStore
export const evaluateFlagFromCustomFeatureStore = async (
  flagKey: string,
  context: LDContext,
  defaultValue: boolean,
  sdkKey: string
) => {
  // Initialize LaunchDarkly client with custom FeatureStore
  const ldClient = init({
    sdkKey: sdkKey,
    featureStoreProvider: new FeatureStore(sdkKey),
  });

  // Evaluate the flag for the given context
  return ldClient.variation(flagKey, context, defaultValue);
};

// Main function executed on client request
export async function onClientRequest(request: EW.IngressClientRequest) {
  try {
    // Get LaunchDarkly client key from EdgeWorker variable
    const LD_CLIENT_KEY = request.getVariable('PMUSER_LD_CLIENT_KEY') as string;
    let authorizationHeader = request.getHeader('Authorization');
    let payload = ''
    let userClaim, groupsClaim;

    // Extract and decode JWT claims if Authorization header is present
    if (authorizationHeader) {
      let jwt = authorizationHeader[0];
      payload = jwt.split('.')[1];

      const claims = base64url.decode(payload, "String") as string;

      const claimsObject = JSON.parse(claims)
      userClaim = claimsObject.sub
      logger.debug(userClaim)
      groupsClaim = claimsObject.nexusGroups
      logger.debug(JSON.stringify(groupsClaim))
    }

    // Create LaunchDarkly context from JWT claims
    const context: LDContext = {
      kind: 'user',
      key: userClaim,
      options: {
        bootstrap: 'localStorage',
        streaming: true
      },
      groups: groupsClaim
    };

    // Evaluate the feature flag
    const result = await evaluateFlagFromCustomFeatureStore(
      LD_FLAG_KEY,    
      context,
      false,          // Default value if there's a problem reading the flag
      LD_CLIENT_KEY
    );

    logger.debug(result)

    // Route the request based on the flag evaluation result
    if (result) {
      request.route({origin: LD_FLAG_KEY})
      logger.debug('Routing to alternate origin');
    } else {
      logger.debug('Routing to default origin');
    }

  } catch (err) {
    // Handle errors by responding with a 500 status code
    request.respondWith(500, {}, `Something went wrong: ${err?.toString()}`);
  }
}