# edgeworkers-json-inline
Demo for inlining NetStorage hosted JSON in HTML with Akamai EdgeWorkers

*Keyword(s):* response-provider, api-orchestration, circleci<br>

This example demonstrates how EdgeWorkers can be used to merge an internal call to Akamai NetStorage to retrieve some data and inline it into the HTML for the final response to the user. This example is based on the [find-replace-stream](https://github.com/akamai/edgeworkers-examples/tree/master/edgeworkers/libraries/find-replace-stream) use-case in the official Akamai repository.

This EdgeWorker fetches (`httpRequest` function) the contents of a file hosted in NetStorage. The Akamai property is configured to route the request to NetStorage by using the same hostname from the original request.In this use-case the content is a JSON string, however it will be treated as a string and not as a JSON object. 

`{"unicorns": "awesome", "abc": [4, 5, 6], "careful": "to escape &#39; quotes"}`

In the EdgeWorker the above string is assembled to form a data class json-data to inline in the HTML.

`<data class="json-data" value='{"unicorns": "awesome", "abc": [4, 5, 6], "careful": "to escape &#39; quotes"}'></data>`

## Considerations when using NetStorage

- When NetStorage is used as an origin a path rewrite occurs to prepend /cpcode/ which the EdgeWorker will use by default. 
- NetStorage is for static assets so a mininmum caching time of 10 min is required. This is configurable in the Akamai property. 

## CircleCI (Optional)
Based on the [Turbo Akamai Edgeworkers](https://github.com/jaescalo/Turbo-Akamai-EdgeWorkers) project. CircleCI can automate the deployment to staging for this EdgeWorker on each `git commit`. The asociated configuration is in the `.circleci.yml` file.
[CircleCI Contexts](https://circleci.com/docs/2.0/contexts/]) is are used to pass on sensitive information in variables to the configuration file `.circleci.yml`. The following variables should be managed under CirecleCI Contexts for this example. 

### Account Info Variables
- $ACCOUNTKEY: Optional. Used to switch between accounts. If not needed remove all associations and the `--accountkey` flag from the commands.
- $HOSTNAME: Hostname associated to the property running EdegeWorkers. Used to create the enhanced debugging token.

### Akamai API Credential Variables
- $ACCESS_TOKEN
- $HOST
- $CLIENT_SECRET
- $CLIENT_TOKEN

## Similar Uses

SubRequests being made from EdgeWorkers can open up numerous possibilities to generate responses for APIs. 
    
## More details on EdgeWorkers
- [Akamai EdgeWorkers](https://developer.akamai.com/akamai-edgeworkers-overview)
- [Akamai EdgeWorkers User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-14077BCA-0D9F-422C-8273-2F3E37339D5B.html)
- [Akamai EdgeWorkers Examples](https://github.com/akamai/edgeworkers-examples)
- [Akamai CLI for EdgeWorkers](https://developer.akamai.com/legacy/cli/packages/edgeworkers.html)