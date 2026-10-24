from pathlib import Path
import shutil

BASE = Path.home() / "ORCA"
OUTPUTS = BASE / "outputs"
DASHBOARD = OUTPUTS / "dashboard_csv"

DASHBOARD.mkdir(parents=True, exist_ok=True)

datasets = {
    "coral_risk_by_site": OUTPUTS / "coral_risk_by_site_csv",
    "plastic_gdp_country_comparison": OUTPUTS / "plastic_gdp_country_comparison_csv",
    "plastic_gdp_quartile_summary": OUTPUTS / "plastic_gdp_quartile_summary_csv",
    "plastic_gdp_country_ranking": OUTPUTS / "plastic_gdp_country_ranking_csv",
    "plastic_gdp_year_summary": OUTPUTS / "plastic_gdp_year_summary_csv",
}

for name, source_dir in datasets.items():
    if not source_dir.exists():
        print(f"NOT FOUND: {source_dir}")
        continue

    csv_files = list(source_dir.glob("part-*.csv"))

    if not csv_files:
        print(f"No CSV part file found in: {source_dir}")
        continue

    destination = DASHBOARD / f"{name}.csv"
    shutil.copy2(csv_files[0], destination)
    print(f"Created: {destination}")

print("\nDashboard CSV export completed.")
