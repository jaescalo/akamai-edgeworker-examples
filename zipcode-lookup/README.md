# edgeworkerskv-zipcode-lookup
Demo for looking up status values about ZIP Codes with Akamai EdgeWorkers EdgeKV

*Keyword(s):* response-provider, key-value, circleci<br>

This example demonstrates how EdgeWorkers and EdgeKV can be used to build a response based on entries stored in EdgeKV (key-value store). This example is based on the [hello-world](https://github.com/akamai/edgeworkers-examples/tree/master/edgekv/examples/hello-world) example in the official Akamai repository.

This EdgeWorker extracts the ZIP Code determined by Akamai's Edgescape and uses it as the key to consult EdgeKV. If the ZIP code exists in EdgeKV as a key then a response is constructed with the value for the key. In this example the values are JSON strings:

`{"zipCodeStatus": "blocked"}`

And if the key does not exist in EdgeKV the default value to return:

`{"zipCodeStatus": "unblocked"}`

[The EdgeKV CLI](https://github.com/akamai/cli-edgeworkers/blob/master/docs/edgekv_cli.md) can be used to write new entries to EdgeKV. For example if a new ZIP code should be blocked the following command can be executed:

`$ akamai edgekv write jsonfile production techjam participant7 75023 ./data.json`

Where 75023 is the ZIP Code (key) and the ./data.json file contains the JSON string used as value.

## Prerequisite
* Download the latest [edgekv.js](https://github.com/akamai/edgeworkers-examples/blob/master/edgekv/lib/edgekv.js) library file and copy it to your EdgeWorker bundle directory. The one in this repository may not be the latest version.

## CircleCI (Optional)
Based on the [Turbo Akamai Edgeworkers](https://github.com/jaescalo/Turbo-Akamai-EdgeWorkers) project. CircleCI can automate the deployment to staging for this EdgeWorker on each `git commit`. The asociated configuration is in the `.circleci.yml` file.
[CircleCI Contexts](https://circleci.com/docs/2.0/contexts/]) is are used to pass on sensitive information in variables to the configuration file `.circleci.yml`. The following variables should be managed under CirecleCI Contexts for this example. 

### Account Info Variables
- $ACCOUNTKEY: Optional. Used to switch between accounts. If not needed remove all associations and the `--accountkey` flag from the commands.
- $HOSTNAME: Hostname associated to the property running EdegeWorkers. Used to create the enhanced debugging token.

### Edge KV variables
- $EDGEKV_NAMESPACE: EdgeKV namespace to build the edgekv_tokens.js
- $EDGEKV_TOKEN_NAME: EdgeKV token name to build the edgekv_tokens.js
- $EDGEKV_TOKEN_VALUE: EdgeKV token to build the edgekv_tokens.js

### Akamai API Credential Variables
- $ACCESS_TOKEN
- $HOST
- $CLIENT_SECRET
- $CLIENT_TOKEN

## More details on EdgeWorkers
- [Akamai EdgeWorkers](https://developer.akamai.com/akamai-edgeworkers-overview)
- [Akamai EdgeWorkers User Guide](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-14077BCA-0D9F-422C-8273-2F3E37339D5B.html)
- [Akamai EdgeWorkers Examples](https://github.com/akamai/edgeworkers-examples)
- [Akamai CLI for EdgeWorkers](https://developer.akamai.com/legacy/cli/packages/edgeworkers.html)
- [Akamai EdgeKV](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/index.html)
- [Akamai EdgeKV CLI](https://github.com/akamai/cli-edgeworkers/blob/master/docs/edgekv_cli.md)