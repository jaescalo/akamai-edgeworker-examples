# Akamai EdgeWorker & EdgeKV Redirector: Bucketing Method

Managing thousands of redirects or even millions can be successfully performed with the help of EdgeKV (EKV), where all the redirects references can be stored. An EdgeWorker (EW) is then configured to read from EKV and perform the redirects at the edge.

This repository provides the following:
- The EW in `./edgeworker` in charge of reading from EKV and redirecting
- A NodeJS script (`bucket-redirects.js`) that prepares the initial redirects data as buckets to upload to EKV

## EdgeKV Setup
EdgeKV must be available in the account and the following should be configured.
1. An EKV namespace
2. An EKV group
3. An EKV token (required by the EW to perform EKV operations)

## Redirects Initial Data
The NodeJS `bucket-redirects.js` script in this repository reads a CSV and creates as many buckets as specified by the user by leveraging the `murmurhash3js` module. The bucketed output is stored in a new CSV.

For example, the input CSV could look like this:
```
source,target
/DOC99000,/us-en/NEW-URL-DOC99000
/DOC99001,/us-en/NEW-URL-DOC99001
/DOC99002,/us-en/NEW-URL-DOC99002
/DOC99003,/us-en/NEW-URL-DOC99003
```
Where `source` represents the original redirect path and `target` represents the resulting redirect. 

And the output CSV may look like:
```
key,value
bucket_0,"{""/DOC99001"":""/us-en/NEW-URL-DOC99001"",""/DOC99002"":""/us-en/NEW-URL-DOC99002""}"
bucket_1,"{""/DOC99000"":""/us-en/NEW-URL-DOC99000"",""/DOC99003"":""/us-en/NEW-URL-DOC99003""}"
```

A side benefit of the `bucket_#` naming convention for the key is that it contains only alphanumeric, `-` and `_` characters which are supported for EKV item names.

### Updating the Redirects
The `bucket-redirects.js` supports updates to the input redirects file and will create a folder named `./modified_buckets` which will contain:
* A `bucketed_modified_*.csv` which contains only the modified buckets which can be used to import only the modified buckets to EKV.
* A summary `bucketed_modified_*.txt` which contains only the bucket IDs that were modified. 

For the very first bucketing the `./modified_buckets/bucketed_modified_*.*` file will also be created for reference, and the original output file contents will be exactly the same to the `bucketed_modified_*.csv` file.
Whenever there are updates to the origin input redirects file, the original output file is also updated with the latest changes, making this output file the source of truth for all redirects.

### Bucketing Script Usage
The script `bucket-redirects.js` can be used as follows:

```
Usage: bucket-redirects [options]

A tool to process redirects into buckets

Options:
  -i, --input <file>      input file path (default: "redirects.csv")
  -o, --output <file>     output file path (default: "bucketed_redirects.csv")
  -b, --buckets <number>  number of buckets (default: "100")
  -v, --version           output the current version
  -h, --help              display help information
```

#### Example: create buckets
Generate a new CSV for 200 buckets:
```
$ node bucket-redirects.js -i redirects.csv -o bucketed.csv -b 200
```

#### Example: update buckets
For updating the buckets the initial redirects data must be updated. Then the same command originally executed must be executed again. Assuming the previous example was our origin execution for creating all the buckets, we would run the following to update our redirects:
```
$ node bucket-redirects.js -i redirects.csv -o bucketed.csv -b 200
```

### Import to EKV
The data can now be uploaded to EKV. See the [Akamai EdgeKV Python Importer](https://github.com/jaescalo/akamai-edgeworker-examples/tree/main/ekv-importer). 
With this tool the data will be imported to EKV as a JSON string. For example:
```
{"key": "bucket_0", "value": {"/DOC99036": "/us-en/NEW-URL-DOC99036", "/DOC99162": "/us-en/NEW-URL-DOC99162", "/DOC99505": "/us-en/NEW-URL-DOC99505", "/DOC99830": "/us-en/NEW-URL-DOC99830", "/DOC99939": "/us-en/NEW-URL-DOC99939"}}
```
Where `key` is the EKV item name which corresponds to the bucket ID. 

## EdgeWorker Redirector
The EW code that executes the redirects at the edge can be found in `./edgeworker/src/main.js`. 

Keep in mind that the `edgekv.js` [helper library](https://techdocs.akamai.com/edgekv/docs/library-helper-methods) and the `edgekv_tokens.js` [access tokens](https://techdocs.akamai.com/edgekv/docs/generate-and-retrieve-edgekv-access-tokens) are required for the EdgeWorker to successfully read from EdgeKV. 

Observe that the EW must perform the same hashing operation on the incoming URL's path to determine the bucket ID. Additional logic should be added to the EW code to account for specific matching criteria or parsing the data returned by EKV.

## Redirects Validator
You can validate all the redirects by using the [Redirects Validator Tool](../utils/redirects_validator/README.md) in this repository.