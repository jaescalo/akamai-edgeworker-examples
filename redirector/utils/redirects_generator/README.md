# Redirects Generator (for tests)

The `redirects_generatator.py` can be used to create a list of redirects in a CSV file. The resulting redirects would look like this:
```
source,target
/DOC99000,/us-en/NEW-URL-DOC99000
/DOC99001,/us-en/NEW-URL-DOC99001
/DOC99002,/us-en/NEW-URL-DOC99002
/DOC99003,/us-en/NEW-URL-DOC99003
```
You can generate even millions of redirects this way to further test with other tools in this repository, such as the [EKV Importer](../../../ekv-importer/), [Bucketing](../../bucketing/) or the [Redirects Validator](../redirects_validator/)

## Usage
```
usage: redirects_generator.py [-h] [-n NUM_ENTRIES] [-o OUTPUT] [-s START]

Generate a CSV file with sequential document redirects.

options:
  -h, --help            show this help message and exit
  -n NUM_ENTRIES, --num-entries NUM_ENTRIES
                        Number of redirect entries to generate (default: 10)
  -o OUTPUT, --output OUTPUT
                        Output filename (default: redirects.csv)
  -s START, --start START
                        Starting document number (default: 99000)
  ```

### Example:
To generate 1000 redirects in a default file named `redirects.csv`:
```
$ python3 redirects_generator.py -n 1000  
```
