import csv
import os
from pathlib import Path

def generate_redirects_csv(filename='redirects.csv', num_entries=100, start_num=99000):
    """
    Generate a CSV file with sequentially numbered document URLs and their redirects.
    
    Args:
        filename (str): Name of the output CSV file
        num_entries (int): Number of redirect entries to generate
        start_num (int): Starting number for document numbering
    """
    # Create the CSV file
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        
        # Write header
        writer.writerow(['source', 'target'])
        
        # Generate sequential entries
        for i in range(num_entries):
            doc_num = start_num + i
            source_path = f"/DOC{doc_num}"
            target_url = f"/us-en/NEW-URL-DOC{doc_num}"
            
            # Write the row
            writer.writerow([source_path, target_url])
    
    print(f"Successfully generated {num_entries} redirect entries in {filename}")
    print(f"File size: {Path(filename).stat().st_size / 1024:.2f} KB")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate a CSV file with sequential document redirects.')
    parser.add_argument('-n', '--num-entries', type=int, default=10,
                        help='Number of redirect entries to generate (default: 10)')
    parser.add_argument('-o', '--output', type=str, default='redirects.csv',
                        help='Output filename (default: redirects.csv)')
    parser.add_argument('-s', '--start', type=int, default=99000,
                        help='Starting document number (default: 99000)')
    
    args = parser.parse_args()
    
    generate_redirects_csv(args.output, args.num_entries, args.start)