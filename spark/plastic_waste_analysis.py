from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, min, max, avg, round as spark_round
)
from pathlib import Path

BASE_DIR = Path.home() / "ORCA"
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "outputs"

spark = (
    SparkSession.builder
    .appName("ORCA Plastic Waste Analysis")
    .master("local[*]")
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")


def load_csv(filename):
    path = str(DATA_DIR / filename)
    print(f"\n{'=' * 70}")
    print(f"DATASET: {filename}")
    df = (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .option("mode", "PERMISSIVE")
        .csv(path)
    )

    df.printSchema()
    df.show(5, truncate=False)
    print(f"Rows: {df.count()}")
    return df


# 1. Global plastic production by year
production = load_csv("cleaned_global_plastics_production.csv")

production.select(
    "Year", "Global plastics production (million tonnes)"
).groupBy("Year").agg(
    spark_round(
        avg(col("Global plastics production (million tonnes)")), 2
    ).alias("global_production_million_tonnes")
).orderBy("Year").show(100, truncate=False)

production_summary = production.agg(
    min("Year").alias("first_year"),
    max("Year").alias("last_year"),
    count("*").alias("records"),
    spark_round(
        avg(col("Global plastics production (million tonnes)")), 2
    ).alias("average_production_million_tonnes"),
    spark_round(
        max(col("Global plastics production (million tonnes)")), 2
    ).alias("maximum_production_million_tonnes")
)

production_summary.show(truncate=False)

# 2. Global share of mismanaged waste
global_waste = load_csv("cleaned_mismanaged_waste_global_total.csv")

global_waste.groupBy("Year").agg(
    spark_round(
        avg(col("Mismanaged waste (% global total)")), 3
    ).alias("mismanaged_waste_global_share_pct")
).orderBy("Year").show(100, truncate=False)

# 3. Per-capita mismanaged plastic waste and GDP
mismanaged_pc = load_csv(
    "cleaned_per_capita_mismanaged_plastic_waste_vs_gdp_per_capita.csv"
)

mismanaged_pc.show(10, truncate=False)

# 4. Per-capita plastic waste and GDP
plastic_pc = load_csv(
    "cleaned_per_capita_plastic_waste_vs_gdp_per capita.csv"
)

plastic_pc.show(10, truncate=False)


# Save the loaded datasets as Parquet and export a CSV summary where possible.
datasets = {
    "global_plastic_production": production,
    "global_mismanaged_waste": global_waste,
    "per_capita_mismanaged_waste": mismanaged_pc,
    "per_capita_plastic_waste": plastic_pc,
}

for name, df in datasets.items():
    parquet_path = OUTPUT_DIR / f"{name}_analysis_parquet"
    csv_path = OUTPUT_DIR / f"{name}_analysis_csv"

    df.write.mode("overwrite").parquet(str(parquet_path))
    df.coalesce(1).write.mode("overwrite").option(
        "header", True
    ).csv(str(csv_path))

    print(f"Saved Parquet: {parquet_path}")
    print(f"Saved CSV folder: {csv_path}")

print("\nORCA plastic waste analysis completed.")
spark.stop()
