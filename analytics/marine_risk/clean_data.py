
import pandas as pd
from pathlib import Path

# File locations
input_file = Path("data/Datas.xlsx")
output_folder = Path("output")
output_file = output_folder / "cleaned_data.csv"

# Create output folder if it does not exist
output_folder.mkdir(exist_ok=True)

# Load dataset
df = pd.read_excel(input_file)

print("Original dataset shape:", df.shape)

# Remove duplicate rows
df = df.drop_duplicates()

# Remove rows with missing values
df = df.dropna()

# Convert Year to integer
df["Year"] = df["Year"].astype(int)

# Sort data by year
df = df.sort_values("Year").reset_index(drop=True)

# Save cleaned dataset
df.to_csv(output_file, index=False)

print("\nCleaned dataset shape:", df.shape)
print("Missing values after cleaning:")
print(df.isnull().sum())

print("\nCleaned dataset saved to:", output_file)
print("\nFirst 5 cleaned rows:")
print(df.head())
