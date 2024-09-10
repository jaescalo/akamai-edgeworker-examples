# Akamai EdgeWorker & EdgeKV Redirector

Managing thousands of redirects or even millions can be successfully performed with the help of EdgeKV (EKV), where all the redirects references can be stored. An EdgeWorker (EW) is then configured to read from EKV and perform the redirects at the edge.

This repository provides the following:
- The EW in charge of reading from EKV and redirecting
- A Python script (`utils/redirects_ekv_prep.py`) that prepares the initial redirects data for EKV
- A Python script (`utils/redirects_validator.py`) that validates the redirects once these are active

## EdgeKV Setup
EdgeKV must be available in the account and the following should be configured.
1. An EKV namespace
2. An EKV group
3. An EKV token (required by the EW to perform EKV operations)

## Redirects Initial Data
The Python scripts in this repository ingest CSV data for simplicity. Let's take for example the following CSV data.
```
source,target
/DOC99000,/us-en/NEW-URL-DOC99000
/DOC99001,/us-en/NEW-URL-DOC99001
/DOC99002,/us-en/NEW-URL-DOC99002
/DOC99003,/us-en/NEW-URL-DOC99003
```
Where `source` represents the original redirect path and `target` represents the resulting redirect. Additional data can be added to the CSV, for example a new column for the status code (e.g. 301, 302). The EW code should be ready to handle any additional data if needed.

### Hashing
As seen from the initial data the `source` can contain forward slashes (`/`), however EKV item names can only contain alphanumeric, `-` and `_` characters. Therefore we can generate a SHA-256 hash based on the `source` and use the result as the EKV item name instead. 

In general hashing entries for keys in a database can also be a good practice, especially when dealing with millions of items. Some good reasons can be faster lookups, deduplication, caching and scalability.

#### Redirects Prep. Script
The script `/utils/redirects_ekv_prep.py` reads the original CSV and adds a new column named `key` which contains the SHA-256 hash based on the provided value for the EKV item name. For the redirects use case that will normally be the source path/URL. 

```
Usage: redirects_ekv_prep.py [OPTIONS]

Options:
  -f, --filename PATH       Path to the CSV file  [required]
  -s, --source-column TEXT  Column name to use as the source URL for the
                            redirect  [required]
  -t, --target-column TEXT  Column name to use as the target URL for the
                            redirect  [required]
  --help                    Show this message and exit.
```
##### Example
Generate a new CSV using the `source` column as the values for the SHA-256 hash:

```
$ python3 redirects_ekv_prep.py -f example_redirects_input.csv -s source -t target
```
The output CSV will look like this:
```
key,source,target
a30dfbbdcf4756f616c58e08bcfd381e81b86ea78f6cc743db3c4d8fdc2de537,/DOC99000,/us-en/NEW-URL-DOC99000
4841a09c9f224ad172f8b36aabb6d05bba3eb44b8497405fe4ab41fbbe241849,/DOC99001,/us-en/NEW-URL-DOC99001
71a34055aab6d6320d67cc925aeceb325e256a975be38a1cdfc9cb45acc412d0,/DOC99002,/us-en/NEW-URL-DOC99002
d7e351f3eec4aef4a9b586e58ef3e72543e7fc23986d9b7bc5ef1f6f3369b008,/DOC99003,/us-en/NEW-URL-DOC99003
```

### Import to EKV
The data can now be uploaded to EKV. See the [Akamai EdgeKV Python Importer](https://github.com/jaescalo/akamai-edgekv-importer/tree/main). 
With this tool the data will be imported to EKV as a JSON string. For example:
```
{"key": "a30dfbbdcf4756f616c58e08bcfd381e81b86ea78f6cc743db3c4d8fdc2de537", "source": "/DOC99000", "target": "/us-en/NEW-URL-DOC99000"}
```
Where `key` is the EKV item name. 

## EdgeWorker Redirector
The EW code that executes the redirects at the edge can be found in `src/main.js`. 

Keep in mind that the `edgekv.js` [helper library](https://techdocs.akamai.com/edgekv/docs/library-helper-methods) and the `edgekv_tokens.js` [access tokens](https://techdocs.akamai.com/edgekv/docs/generate-and-retrieve-edgekv-access-tokens) are required for the EdgeWorker to successfully read from EdgeKV. 

Observe that the EW must perform the same SHA256 than the `utils/redirects_ekv_prep.py` script as the result will be the item to lookup in EKV. Additional logic should be added to the EW code to account for specific matching criteria or parsing the data returned by EKV.


## Redirects Validator
The `utils/redirects_validator.py` can validate all the redirects from the original CSV or the CSV that contains the hashes. For simplicity let's use the original CSV:
```
source,target
/DOC99000,/us-en/NEW-URL-DOC99000
/DOC99001,/us-en/NEW-URL-DOC99001
/DOC99002,/us-en/NEW-URL-DOC99002
/DOC99003,/us-en/NEW-URL-DOC99003
```
The data needs the hostname where the EdgeWorker Redirector is enabled which can be passed in the command line:
```
Usage: redirects_validator.py [OPTIONS]

Options:
  -f, --filename PATH       Path to the CSV file  [required]
  -h, --hostname TEXT       The hostname for the source and target URLs
                            [required]
  -s, --source-column TEXT  Column name to use as the source URL for the
                            redirect  [required]
  -t, --target-column TEXT  Column name to use as the target URL for the
                            redirect  [required]
  --help                    Show this message and exit.
  ```

### Example:
Following the original CSV file example with the following command we tell the script which hostname to use for the redirect, which is the source path/URL and what to expect in the target (Location header).
```
$ python3 redirects_validator.py --filename example_redirects_input.csv -h www.example.com -s source -t target
```
The output will be a new CSV with the result for each redirect. For example:
```
source URL,target URL,Validation Status
https://www.example.com/DOC99000,https://www.example.com/us-en/NEW-URL-DOC99000,True
https://www.example.com/DOC99001,https://www.example.com/us-en/NEW-URL-DOC99001,True
https://www.example.com/DOC99002,https://www.example.com/us-en/NEW-URL-DOC99002,True
https://www.example.com/DOC99003,https://www.example.com/us-en/NEW-URL-DOC99003,True
```