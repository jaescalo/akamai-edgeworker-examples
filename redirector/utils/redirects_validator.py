import pandas as pd
import requests
import click
from concurrent.futures import ThreadPoolExecutor

@click.command()
@click.option('--filename', '-f', required=True, type=click.Path(exists=True), help='Path to the CSV file')
@click.option('--hostname', '-h', required=True, help='The hostname for the source and target URLs')
@click.option('--source-column', '-s', required=True, help='Column name to use as the source URL for the redirect')
@click.option('--target-column', '-t', required=True, help='Column name to use as the target URL for the redirect')
def validate_all_redirects(filename, hostname, source_column, target_column):
    
    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv(filename)

    # Prepend hostname to source and target columns
    df[source_column] = 'https://' + hostname + df[source_column].astype(str)
    #df[target_column] = 'https://' + hostname + df[target_column].astype(str)
    
    # Extract URL pairs
    url_pairs = df[[source_column, target_column]].values.tolist()
    
    # Count total URLs
    total_urls = len(url_pairs)
    
    # Track progress
    processed_urls = 0
    
    # Validate redirects in parallel
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = []
        for result in executor.map(validate_redirect, url_pairs):
            results.append(result)
            processed_urls += 1
            print(f"Processed {processed_urls}/{total_urls} URLs", end="\r")
    
    # Create DataFrame for results
    result_df = pd.DataFrame(results, columns=['source URL', 'target URL', 'Validation Status', 'Status Code'])
    
    # Save the DataFrame to a new CSV file
    result_df.to_csv('validator-' + filename, index=False)

    return 

def validate_redirect(url_pair):
    source_url, target_url = url_pair
    try:
        response = requests.get(source_url, allow_redirects=False, timeout=10)
        location = response.headers.get('Location', '')
        if response.status_code == 301:
            location = response.headers.get('Location', '')
            return source_url, target_url, location in target_url, response.status_code
        else:
            return source_url, target_url, False, response.status_code
    except Exception as e:
        print(f"Error validating URL {source_url}: {str(e)}")
        return source_url, target_url, False, "ERROR"
    

def main():
    validate_all_redirects()
    return

if __name__ == "__main__":
    main()
