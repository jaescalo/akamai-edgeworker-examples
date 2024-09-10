# edgeworkers-json-inline
Demo for sending an mPulse reporting-API request from EW.

*Keyword(s):* mpulse, reporting-api, circleci<br>

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