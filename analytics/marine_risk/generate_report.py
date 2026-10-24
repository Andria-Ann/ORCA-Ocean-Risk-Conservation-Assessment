
import pandas as pd
from pathlib import Path

# File locations
input_file = Path("output/clustered_data.csv")
output_folder = Path("output")

# Load clustered dataset
df = pd.read_csv(input_file)

production = "Global plastics production (million tonnes)"

# Sort by year
df = df.sort_values("Year")

# Calculate basic statistics
first_year = df.iloc[0]
last_year = df.iloc[-1]

initial_production = first_year[production]
final_production = last_year[production]

if initial_production != 0:
    percentage_change = (
        (final_production - initial_production)
        / initial_production
    ) * 100
else:
    percentage_change = None

# Create report
report = []

report.append("MARINE RISK ANALYSIS PROJECT")
report.append("Global Plastics Production Analysis")
report.append("=" * 45)

report.append(f"\nYears covered: {first_year['Year']}–{last_year['Year']}")
report.append(f"Total records: {len(df)}")
report.append(f"Initial production: {initial_production} million tonnes")
report.append(f"Final production: {final_production} million tonnes")
report.append(f"Minimum production: {df[production].min()} million tonnes")
report.append(f"Maximum production: {df[production].max()} million tonnes")
report.append(f"Average production: {df[production].mean():.2f} million tonnes")

if percentage_change is not None:
    report.append(f"Percentage change: {percentage_change:.2f}%")

report.append("\nPRODUCTION CLUSTER SUMMARY")
report.append("-" * 45)

cluster_summary = df.groupby("Production_Cluster").agg(
    Number_of_Records=(production, "count"),
    Average_Production=(production, "mean"),
    Minimum_Production=(production, "min"),
    Maximum_Production=(production, "max")
).round(2)

report.append(cluster_summary.to_string())

report.append("\n\nLIMITATION")
report.append(
    "This dataset measures global plastics production, "
    "not direct marine pollution or ocean risk. "
    "The clusters represent production levels only."
)

# Save report
report_text = "\n".join(report)

with open(output_folder / "analysis_report.txt", "w", encoding="utf-8") as file:
    file.write(report_text)

cluster_summary.to_csv(output_folder / "cluster_summary.csv")

print(report_text)
print("\nReport saved to output/analysis_report.txt")
print("Cluster summary saved to output/cluster_summary.csv")
