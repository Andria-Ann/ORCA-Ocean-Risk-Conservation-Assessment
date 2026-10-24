
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

# File locations
input_file = Path("data/Datas.xlsx")
output_folder = Path("output")
output_folder.mkdir(exist_ok=True)

# Load cleaned data
df = pd.read_csv(output_folder / "cleaned_data.csv")

# Column name
production = "Global plastics production (million tonnes)"

# Graph 1: Plastics production over time
plt.figure(figsize=(10, 5))
plt.plot(df["Year"], df[production], marker="o")
plt.title("Global Plastics Production (1950–2015)")
plt.xlabel("Year")
plt.ylabel("Production (million tonnes)")
plt.grid(True)
plt.tight_layout()
plt.savefig(output_folder / "production_trend.png", dpi=300)
plt.show()

# Graph 2: Distribution of plastics production
plt.figure(figsize=(8, 5))
plt.hist(df[production], bins=10, edgecolor="black")
plt.title("Distribution of Global Plastics Production")
plt.xlabel("Production (million tonnes)")
plt.ylabel("Frequency")
plt.tight_layout()
plt.savefig(output_folder / "production_distribution.png", dpi=300)
plt.show()

print("Graphs created successfully!")
print("Saved in the output folder:")
print("- production_trend.png")
print("- production_distribution.png")
