from pathlib import Path
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum as spark_sum

BASE = Path.home() / "ORCA"
OUT = BASE / "outputs"

spark = (
    SparkSession.builder
    .appName("ORCA Spark Output Validation")
    .master("local[*]")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")


def validate(name, path, key_columns=None):
    print(f"\n{'=' * 60}")
    print(f"Checking: {name}")

    if not path.exists():
        print(f"NOT FOUND: {path}")
        return

    df = spark.read.parquet(str(path))
    total = df.count()

    print(f"Rows: {total}")
    print(f"Columns: {len(df.columns)}")
    print(f"Column names: {df.columns}")

    missing_exprs = [
        spark_sum(
            col(c).isNull().cast("long")
        ).alias(c)
        for c in df.columns
    ]

    missing = df.agg(*missing_exprs).first().asDict()
    missing = {k: v for k, v in missing.items() if v and v > 0}

    print("Columns with missing values:", missing or "None")

    if key_columns:
        duplicates = (
            df.groupBy(*key_columns)
            .agg(count("*").alias("records"))
            .filter(col("records") > 1)
        )

        duplicate_groups = duplicates.count()
        print(f"Duplicate key groups ({key_columns}): {duplicate_groups}")

        if duplicate_groups:
            duplicates.show(10, truncate=False)

    df.show(5, truncate=False)


validate(
    "Coral risk by site",
    OUT / "coral_risk_by_site",
    ["site_name"]
)

validate(
    "Plastic and GDP comparison",
    OUT / "plastic_gdp_country_comparison_parquet",
    ["Entity", "Code", "Year"]
)

validate(
    "GDP quartile summary",
    OUT / "plastic_gdp_quartile_summary_parquet"
)

validate(
    "GDP country ranking",
    OUT / "plastic_gdp_country_ranking_parquet",
    ["Entity", "Code", "Year"]
)

validate(
    "GDP yearly summary",
    OUT / "plastic_gdp_year_summary_parquet",
    ["Year"]
)

print("\nValidation checks completed.")
spark.stop()
