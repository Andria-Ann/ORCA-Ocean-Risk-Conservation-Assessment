
import pandas as pd
from pathlib import Path

file_path = Path("data/Datas.xlsx")

if not file_path.exists():
    print("Dataset not found!")
    print("Check that datas.xlsx is inside the data folder.")
else:
    df = pd.read_excel(file_path)

    print("\n--- FIRST 5 ROWS ---")
    print(df.head())

    print("\n--- DATASET SHAPE ---")
    print(df.shape)

    print("\n--- COLUMN NAMES ---")
    print(df.columns.tolist())

    print("\n--- DATA TYPES ---")
    print(df.dtypes)

    print("\n--- MISSING VALUES ---")
    print(df.isnull().sum())

    print("\n--- DUPLICATE ROWS ---")
    print(df.duplicated().sum())

    print("\n--- NUMERICAL SUMMARY ---")
    print(df.describe().T)
