# Redirects Validator
The `redirects_validator.py` can validate all the redirects from a CSV file. For example for the following CSV:
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
  -i, --input PATH          Path to the input CSV file  [required]
  -o, --output TEXT         Name of the output CSV containing the redirect
                            results  [required]
  -h, --hostname TEXT       The hostname for the source and target URLs
                            [required]
  -s, --source-column TEXT  Column name to use as the source URL for the
                            redirect  [required]
  -t, --target-column TEXT  Column name to use as the target URL for the
                            redirect  [required]
  --help                    Show this message and exit.
  ```

## Example:
Following the original CSV file example with the following command we tell the script which hostname to use for the redirect, which is the source path/URL and what to expect in the target (Location header).
```
$ python3 redirects_validator.py --input example_redirects_input.csv --output example_redirects_output.csv -h www.example.com -s source -t target
```
The output will be a new CSV with the result for each redirect. For example:
```
source URL,target URL,Validation Status
https://www.example.com/DOC99000,https://www.example.com/us-en/NEW-URL-DOC99000,True
https://www.example.com/DOC99001,https://www.example.com/us-en/NEW-URL-DOC99001,True
https://www.example.com/DOC99002,https://www.example.com/us-en/NEW-URL-DOC99002,False
https://www.example.com/DOC99003,https://www.example.com/us-en/NEW-URL-DOC99003,True
```