#!/usr/bin/python3

import os
import csv
import time
import click
import logging
import requests 
from akamai.edgegrid import EdgeGridAuth
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
load_dotenv()

# Get all the necessary env variables
namespace_id = os.environ.get('AKAMAI_EKV_NAMESPACE_ID')
group_id = os.environ.get('AKAMAI_EKV_GROUP_ID')
network = "production"  # Only for the API method. The EW method will always go to prod unless the hostname is spoofed to staging

account_key = os.environ.get('AKAMAI_CREDS_ACCOUNT_KEY')
baseUrl = "https://{host}".format(host=os.environ.get('AKAMAI_CREDS_HOST'))
session = requests.Session()
session.auth = EdgeGridAuth(
    client_token=os.environ.get('AKAMAI_CREDS_CLIENT_TOKEN'),
    client_secret=os.environ.get('AKAMAI_CREDS_CLIENT_SECRET'),
    access_token=os.environ.get('AKAMAI_CREDS_ACCESS_TOKEN'),
    )

# Set up logging
logging.basicConfig(
    filename='edgekv_importer.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

@click.command()
@click.option('--mode', '-m', required=True, type=click.Choice(['api', 'edgeworker']), help='Write to EKV via the admin API or an EdgeWorker')
@click.option('--filename', '-f', required=True, type=click.Path(exists=True), help='Path to the CSV file')
@click.option('--key-column', '-k', required=True, help='Column name to use as the key')
@click.option('--delete', '-d', is_flag=True, help='Delete the items in EdgeKV instead of upserting')
@click.option('--upload-url', '-u', required=False, help='The URL to upload data to for EdgeWorker mode')
def ekv_bulk_actions(mode, filename, key_column, delete, upload_url):
    """Read the CSV file and upsert the data to Akamai EdgeKV in parallel"""

    # Upload redirects in parallel for the admin API. Based on https://techdocs.akamai.com/edgekv/docs/limits:
    # - Burst limit: 24 hits per second (during any 5 second period)
    # - Average limit: 18 hits per second (during any 2 minute period)
    # Limiting the max_workers=4 for the 'api' mode as it results in ~18 writes/second
    if mode == 'api':
        mode_max_workers = 4
        
    # Upload redirects in parallel for the EdgeWorker. Based on https://techdocs.akamai.com/edgekv/docs/limits:
    # The number of item writes/deletes supported from all EdgeWorkers is (hitting a single edge
    # will may trigger the rate limits sooner):
    # - 200 per second if the item value size is less than 10 KB
    # - 40 per second if the item value size is 10 KB to less than 100 KB
    # - 15 per second if the item value size is 100 KB to less than 250 KB
    # - 1 per second if the item value size is 250 KB to less than 1MB
    # Limiting the max_workers=20 for the 'edgeworker' mode as it results in ~75 writes/second for a single edge
    elif mode == 'edgeworker':
        mode_max_workers = 20
        if not upload_url:
            raise click.UsageError("--upload-url/-u is required when using the 'edgeworker' mode")

    if delete:
        ekv_operation = "delete"
    else:
        ekv_operation = "upsert"
                          
    try:
        # Get the number of rows in the CSV file
        with open(filename, 'r') as csvfile:
            reader_rows = csv.reader(csvfile)
            row_count = sum(1 for row in reader_rows) -1
        print(f"CSV file has {row_count} data rows")
        
        # Track progress
        processed_rows = 0
        
        start_time = time.time()

        # Get the DictReader object
        with open(filename, "r") as csvfile:
            dict_reader = csv.DictReader(csvfile)
            tasks = []

            with ThreadPoolExecutor(max_workers=mode_max_workers) as executor:
                if mode == 'api':
                    for row in dict_reader:
                        key = row[key_column]
                        tasks.append(executor.submit(call_ekv_api, key, row, ekv_operation))
                
                elif mode == "edgeworker":
                    for row in dict_reader:
                        key = row[key_column]
                        tasks.append(executor.submit(call_edgeworker, upload_url, key, row, ekv_operation))
                            
                # Wait for all the tasks to complete
                for task in tasks:
                    processed_rows += 1
                    print(f"Processed {processed_rows}/{row_count} items", end="\r")
                    task.result()
        
            end_time = time.time()

            execution_time = end_time - start_time
            operations_per_second = row_count / execution_time

            print(f"\nProcessed {row_count} items in {execution_time:.2f} seconds")
            print(f"Average rate: {operations_per_second:.2f} operations per second")

            # Create a response message
            response = f"Successfully processed {row_count} items at a rate of {operations_per_second:.2f} ops/sec"

            return response
    
    except Exception as err:
        # If an error occurs, return None for the response and the error message
        return str(err)


def call_ekv_api(item_id, payload, ekv_operation):
    # Check for account key switch for API calls
    if account_key:
        params = { "accountSwitchKey": account_key }
    else:
        params = {}

    url = f'{baseUrl}/edgekv/v1/networks/{network}/namespaces/{namespace_id}/groups/{group_id}/items/{item_id}'

    if ekv_operation == "delete": 
        response = session.delete(url, params=params)
    else:
        response = session.put(url, params=params, json=payload)

    log_response(response, item_id, payload)

    return response


def log_response(response, key, payload):
    # Log the response status code and responses
    if response.status_code != 200:
        logging.error(f"Error updating key '{key}' in EdgeKV. Status code: {response.status_code}")
        logging.error(f"Payload: {payload}")
    else:
        logging.info(f"Successfully updated key '{key}' in EdgeKV. Status code: {response.status_code}")
    return response


def call_edgeworker(upload_url, key, payload, ekv_operation):
    # The following headers tell the EW which EKV to perform the operations to.
    # Additional EW debugging headers can be added:
    # "Pragma": "akamai-x-ew-debug, akamai-x-ew-debug-subs, akamai-x-ew-debug-rp"
    # "Akamai-EW-Trace": "JWT TOKEN"
    headers = {
        "Content-type": "application/json",
        "Ekv-namespace-id": namespace_id,
        "Ekv-group-id": group_id,
        "Ekv-item-id": key,
        "Ekv-operation": ekv_operation
    }
                            
    response = requests.post(upload_url, json=payload, headers=headers, verify=True)

    log_response(response, key, payload)

    return response

def main():
    """Entry point for the script"""
    ekv_bulk_actions()

if __name__ == "__main__":
    main()