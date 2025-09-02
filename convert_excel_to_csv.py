import pandas as pd
import os

# Path to the Excel file
excel_file = 'Other/visiondb.xlsx'

# Path for the output CSV file
csv_file = 'Other/visiondb.csv'

try:
    # Read the Excel file
    print(f"Reading Excel file: {excel_file}")
    df = pd.read_excel(excel_file)
    
    # Save as CSV
    print(f"Converting to CSV: {csv_file}")
    df.to_csv(csv_file, index=False)
    
    print(f"Conversion complete! CSV file saved to: {csv_file}")
    print(f"Number of rows: {len(df)}")
    print(f"Columns: {', '.join(df.columns)}")
    
except Exception as e:
    print(f"Error converting file: {str(e)}")
