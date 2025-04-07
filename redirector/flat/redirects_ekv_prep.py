import pandas as pd
import hashlib
import click

@click.command()
@click.option('--input', '-i', required=True, type=click.Path(exists=True), help='Path to the input CSV file')
@click.option('--output', '-o', required=True, help='Path to the output/results CSV file')
@click.option('--source-column', '-s', required=True, help='Column name to use as the source URL for the redirect')
@click.option('--target-column', '-t', required=True, help='Column name to use as the target URL for the redirect')
def ekv_data_prep(input, output, source_column, target_column):

    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv(input)

    # Extract the source
    df['source'] = df[source_column]

    # Extract the target
    df['target'] = df[target_column]

    # Apply the hash function to only the source path. 
    # Because the key names in EKV support only alphanumeric (0-9, a-z, A-Z), underscore (_), and (-) dash
    # a SHA-256 hash is performed to stored as the key name
    # Additionally, hashing entries in large sets benefit of faster lookups, deduplication and scalability
    df['key'] = df['source'].apply(compute_hash)

    # Keep only the "key", 'source' and 'location' columns
    df = df[['key', 'source', 'target']]

    # Save the DataFrame to a new CSV file
    df.to_csv(output, index=False)


# Function to compute SHA256 hash of a URL path
def compute_hash(url):
    return hashlib.sha256(url.encode()).hexdigest()
    

def main():
    """Entry point for the script"""
    ekv_data_prep()

if __name__ == "__main__":
    main()