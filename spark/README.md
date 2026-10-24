ORCA — Member 2: Spark / PySpark

Overview

The Spark component processes marine, coral, plastic-waste and economic datasets for the Ocean Risk and Conservation Assessment (ORCA) project.

Environment

- Operating system: Ubuntu
- Python: 3.10
- PySpark: 3.5.7
- Execution mode: Local Spark ("local[*]")

Scripts

- "scripts/marine_spark.py" — inspects CSV datasets and exports Parquet outputs.
- "scripts/coral_risk_analysis.py" — aggregates coral observations by site and assigns project-defined screening categories.
- "scripts/plastic_waste_analysis.py" — exports plastic production and waste datasets.
- "scripts/plastic_gdp_comparison.py" — compares per-capita plastic waste with GDP per capita.
- "scripts/validate_spark_outputs.py" — checks selected Parquet outputs for row counts, missing values and duplicate keys.

Main results

- Coral observations summarized across 8 sites.
- Plastic-waste/GDP comparison contains 148 matched country-year records.
- GDP/plastic-waste correlation: approximately +0.347.
- GDP/mismanaged-waste correlation: approximately -0.432.
- The country-level comparison dataset contains observations for 2010.

Important limitations

- Correlation describes association, not causation.
- The GDP comparison currently covers one year, so it does not establish a time trend.
- Coral screening thresholds are project-defined and should not be described as validated ecological risk classifications.
- The validation script checks selected outputs, not every source file or every possible data-quality issue.

Output locations

Generated outputs are saved under "outputs/" in CSV and Parquet folders. CSV outputs are Spark directories containing part files,not single csv files.

Dashboard handoff

Dashboard-ready, single-file CSVs are available in "outputs/dashboard_csv/":

- "coral_risk_by_site.csv" — coral observations summarized by site, including project-defined screening indicators.
- "plastic_gdp_country_comparison.csv" — matched country-level GDP and per-capita plastic-waste comparison.
- "plastic_gdp_quartile_summary.csv" — summary by GDP-per-capita quartile.
- "plastic_gdp_country_ranking.csv" — country-level comparison and ranking.
- "plastic_gdp_year_summary.csv" — summary for the available comparison year (2010).

These CSVs are prepared for dashboard integration. Coordinate with the dashboard developer on how React will load or receive the files.

The original Spark CSV and Parquet outputs are also available under "outputs/". Spark CSV outputs may be directories containing part files rather than single CSV files.

Reproducing the results

Activate the project virtual environment with "source .venv/bin/activate", then run the relevant scripts from the project root. Run "python scripts/validate_spark_outputs.py" to validate the selected outputs. See each script for its input paths and processing logic.
