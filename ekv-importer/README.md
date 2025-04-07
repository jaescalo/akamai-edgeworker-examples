# Akamai EdgeKV Python Importer

This tool aids the initial EdgeKV seeding. The script reads from a CSV file, converts each row to a JSON string which then is used as the value in EdgeKV. As for the item id for EdgeKV it can be any of the column names, just pass it as part of the arguments for the script.
The script also allow for EdgeKV delete operations.

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

## Important Variables
### Environment Variables 
- `namespace_id`: EdgeKV namespace id
- `group_id`: EdgeKV group id
- `account_key`: OPTIONAL. Akamai account ID to be used only if your API credentials allow for multi-account switching
- `baseUrl`: uses the Akamai `host` credential to build the API 
- `client_token`: Akamai `client_token` credential
- `client_secret`: Akamai `client_secret` credential
- `access_token`: Akamai `access_token` credential

### Inline Variables
- `network`: Akamai activation network (staging | production)
- `mode_max_workers`: controls how many concurrent API calls are performed. Useful for keeping requests under the rate limits.

In a future version of this tool the namespace_id, group_id, network and mode_max_workers may be available as options in the CLI instead. 

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
Execution output is logged to `edgekv_importer.log` which can be used to identify any entries that errored or any missing entries. 

## Usage
```
Usage: edgekv_importer.py [OPTIONS]

  Read the CSV file and upsert the data to Akamai EdgeKV in parallel

Options:
  -m, --mode [api|edgeworker]  Write to EKV via the admin API or an EdgeWorker
                               [required]
  -f, --filename PATH          Path to the CSV file  [required]
  -k, --key-column TEXT        Column name to use as the key  [required]
  -d, --delete                 Delete the items in EdgeKV instead of upserting
  -u, --upload-url TEXT        The URL to upload data to for EdgeWorker mode
  --help                Show this message and exit.
```

### Example #1
To import all entries using the Edgeworker mode in CSV and use the `code` column as the item ID for EdgeKV:
```
$ python3 edgekv_importer.py --mode edgeworker --filename example_input.csv -k code -u "https://some.akamaized.host/path"
```

### Example #2
To delete all entries using the Edgeworker mode in CSV and use the `key` column as the item ID for EdgeKV:
```
$ python3 edgekv_importer.py --mode edgeworker --filename example_input.csv -k code -u "https://some.akamaized.host/path" --delete
```

### Example #3
To import all entries using the API mode in CSV and use the `code` column as the item ID for EdgeKV:
```
$ python3 edgekv_importer.py --mode api --filename example_bucketed.csv -k code 
```

### Example #4
To delete all entries using the API mode in CSV and use the `key` column as the item ID for EdgeKV:
```
$ python3 edgekv_importer.py --mode api --filename example_bucketed.csv -k code --delete
```

## Future Improvements
1. Add logging for the API mode
2. Add namespace_id, group_id, network and mode_max_workers as options in the CLI instead. 