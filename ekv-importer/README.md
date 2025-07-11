# Akamai EdgeKV Importer

This tool aids the initial EdgeKV seeding. The script can read items from a CSV file, converts each row to a JSON string which then is used as the value in EdgeKV. As for the item id for EdgeKV it can be any of the column names, just pass it as part of the arguments for the script.
The script also allow for EdgeKV delete operations and single item upsert/delete.

## Modes of Operation
There are 2 modes of operation for writing/deleting to EdgeKV: `edgeworker` or `api`.

### EdgeWorker Mode
This mode leverages an EdgeWorker to perform the writes/deletes to EdgeKV. This mode allows for more writes/deletes per second than the administrative [API mode](#api-mode). See the [rate limits at techdocs.akamai.com](https://techdocs.akamai.com/edgekv/docs/limits)

* An EdgeWorker is required for this mode and you can check the code in charge of writing/deleting EdgeKV items in `./edgeworker/main.js`. 

* To enable the EdgeWorker mode use the `--mode edgeworker` or `-m edgeworker` option. Examples below.

* This mode additionally requires the URL where the EdgeWorker is configured. The URL is passed with the `-u` option.

* Keep in mind that the `edgekv.js` [helper library](https://techdocs.akamai.com/edgekv/docs/library-helper-methods) and the `edgekv_tokens.js` [access tokens](https://techdocs.akamai.com/edgekv/docs/generate-and-retrieve-edgekv-access-tokens) are required for the EdgeWorker to successfully write/delete to EdgeKV. 

* Other security rate controls (e.g. Akamai WAF) may come into play based on the configured thresholds. For such cases:
  * Lower the request rate by setting a smaller number of parallel executors in the `mode_max_workers` variable.
  * Temporarily add exceptions to the security controls.
  * Send the EKV data in batches based on the [HTTP sub-request limits per tier](https://techdocs.akamai.com/edgeworkers/docs/resource-tier-limitations). For instance, the EW is limited to 4 http subrequests this means you need one fourth of the amount of request to upload all the data.
  * To further decrease the amount of requests consider [Bucketing](#bucketing) the items. 
  * To even further decrease the amount of requests consider a combination of the previous 2 pointers above.

#### EdgeWorker Setup
Follow the instructions to:
1. [Create a new EdgeWorker ID](https://techdocs.akamai.com/edgeworkers/docs/create-an-edgeworker-id-1)
2. [Add the EdgeWorker behavior to a property](https://techdocs.akamai.com/edgeworkers/docs/add-the-edgeworker-behavior-1). 
    - By adding the EW behavior to the property any of the hostnames in the property can be used to trigger the EW.
    - You can create any other conditions for the EdgeWorker behavior, for example a path match, header match, CIDR match, etc.
    - For example, if the property serves the hostname www.example.com and you create a patch match condition for the '/upload' path for the EdgeWorker behavior. That means the EW can be triggered by going to https://www.example.com/upload. 
      - **This will be the URL passed with the `-u` option.**

### API Mode
This mode uses the Akamai APIs to perform the writes/deletes to EdgeKV. No EdgeWorker needs to be configured, however the write/delete speed is limited to the administrative API. See the [rate limits at techdocs.akamai.com](https://techdocs.akamai.com/edgekv/docs/limits). 

* You may want to explore this mode if tight security controls such as rate limits are in place for the hostnames under your account.

* To enable the API mode use the `--mode api` or `-m api` option. Examples below.

* To further decrease the amount of requests consider [Bucketing](#bucketing) the items. 

## Bucketing
Bucketing in key/value databases refers to grouping items together under a common key name (usually based on a hash). 

For example, if one were to put 3 million URLs in 10K buckets (300 URLs per bucket) then only 10K writes would be required.

## Bulk Operations or Single Item
There are 2 main subcommands:
- `bulk`: reads items from a CSV file to delete/write to EdgeKV
- `item`: you can provide the item key/value in the script arguments. You can write or delete an item this way.

## Important Variables
### Environment Variables 
- `baseUrl`: uses the Akamai `host` credential to build the API 
- `client_token`: Akamai `client_token` credential
- `client_secret`: Akamai `client_secret` credential
- `access_token`: Akamai `access_token` credential
- `account_key`: OPTIONAL. Akamai account ID to be used only if your API credentials allow for multi-account switching

The following are optional environment variables as the values can be passed as CLI arguments:
- `namespace_id`: EdgeKV namespace id
- `group_id`: EdgeKV group id
- `network`: Akamai activation network (staging | production). This variable only works with the `api` method. If you need to use the `edgeworker` method in the staging network you will need to spoof to staging the hostname used to upload to EdgeKV.

### Inline Variables
- `mode_max_workers`: controls how many concurrent API calls are performed. Useful for keeping requests under the rate limits. This is not available as CLI arguments because the default values should work under any scenario.

## CSV Formatting
The input or seed data must be in CSV format. With some coding to this script any other formats for the input data can be addressed.
The CSV must contain all the entries to import including the item id. 

### Flat CSV
Here's an example of a normal/flat CSV where each value is a string of text:
```
key,code,language,isd
Afghanistan,AFG,ps|da,93
Albania,ALB,sq,355
Algeria,DZA,ar|fr,213
Andorra,AND,ca|es|fr,376
Angola,AGO,pt,244
```
In this example the first column is named `key`. And we will use this column as the item ID for EdgeKV.

### JSON CSV
Here's an example of a CSV where the values are expressed as JSON strings. Note the extra double quotes to account for all the commas inside the JSON string which would otherwise conflict with the CSV formatting. This feature allows for [bucketing](#bucketing).
```
key,value
bucket_0,"{""/DOC99036"":""/us-en/NEW-URL-DOC99036"",""/DOC99162"":""/us-en/NEW-URL-DOC99162""}"
bucket_1,"{""/DOC99006"":""/us-en/NEW-URL-DOC99006"",""/DOC99094"":""/us-en/NEW-URL-DOC99094""}"
```
In this example the first column is named `key`. And we will use this column as the item ID for EdgeKV.

## Logging
Execution output is logged to `*_timestamp.log` which can be used to identify any entries that errored or any missing entries. 

## Usage
```
Usage: edgekv_importer.py [OPTIONS] COMMAND [ARGS]...

  EdgeKV bulk and single upload utility.

Options:
  --help  Show this message and exit.

Commands:
  bulk  Process bulk operations from a CSV file.
  item  Process an item key-value operation.
```

### Example #1
To import all the items from a CSV using the Edgeworker mode and use the `code` column as the item ID for EdgeKV. Environment variables are used for the namespace and group which should be made available to the environment prior to running the command.
```
$ python3 edgekv_importer.py bulk --mode edgeworker --filename example_input.csv -k code -u "https://some.akamaized.host/path"
```

### Example #2
To delete all the items from a CSV using the API mode and use the `key` column as the item ID for EdgeKV. The namespace and group ID are passed as arguments in the CLI instead of environment variables. 
```
$ python3 edgekv_importer.py bulk --mode api --filename example_input.csv -k code --namespace-id my_namespace --group-id my_group --delete
```

### Example #3
Upsert a single item using the API mode. Environment variables are used for the namespace and group which should be made available to the environment prior to running the command.
```
$ python3 edgekv_importer.py item --mode api --key my_key --value my_value -u "https://some.akamaized.host/path" 
```

### Example #4
Delete a single item using the API mode. The namespace, group and activation network are passed as arguments in the CLI instead of environment variables. 
```
$ python3 edgekv_importer.py item --mode api --key my_key --value my_value --namespace-id my_namespace --group-id my_group --network staging --delete
```