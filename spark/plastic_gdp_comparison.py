from pathlib import Path

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    avg, col, count, corr, ntile, round as spark_round
)

BASE = Path.home() / "ORCA"
DATA = BASE / "data"
OUT = BASE / "outputs"

spark = (
    SparkSession.builder
    .appName("ORCA Plastic Waste and GDP Comparison")
    .master("local[*]")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")


def read_csv(filename):
    return (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv(str(DATA / filename))
    )


# Load the two datasets
plastic = read_csv(
    "cleaned_per_capita_plastic_waste_vs_gdp_per capita.csv"
)

mismanaged = read_csv(
    "cleaned_per_capita_mismanaged_plastic_waste_vs_gdp_per_capita.csv"
)

# Rename measurement columns for easier analysis
plastic = plastic.select(
    "Entity",
    "Code",
    "Year",
    col("Per capita plastic waste (kg/person/day)")
        .alias("plastic_waste_kg_person_day"),
    col("GDP per capita, PPP (constant 2011 international $)")
        .alias("gdp_per_capita"),
    col("Total population (Gapminder, HYDE & UN)")
        .alias("population")
)

mismanaged = mismanaged.select(
    "Entity",
    "Code",
    "Year",
    col("Per capita mismanaged plastic waste")
        .alias("mismanaged_waste_per_person"),
)

# Join by country and year
comparison = plastic.join(
    mismanaged,
    on=["Entity", "Code", "Year"],
    how="inner"
)

# Exclude rows missing values needed for numerical analysis
valid = comparison.filter(
    col("gdp_per_capita").isNotNull()
    & col("plastic_waste_kg_person_day").isNotNull()
    & col("mismanaged_waste_per_person").isNotNull()
    & (col("gdp_per_capita") > 0)
)

print("\n=== DATASET COUNTS ===")
print("Plastic dataset rows:", plastic.count())
print("Mismanaged dataset rows:", mismanaged.count())
print("Matched country-year rows:", comparison.count())
print("Rows used for numerical analysis:", valid.count())

print("\n=== CORRELATION WITH GDP PER CAPITA ===")
valid.select(
    corr("gdp_per_capita", "plastic_waste_kg_person_day")
        .alias("gdp_vs_plastic_waste_correlation"),
    corr("gdp_per_capita", "mismanaged_waste_per_person")
        .alias("gdp_vs_mismanaged_waste_correlation")
).show(truncate=False)

# Split observations into four GDP groups.
# Q1 is the lowest GDP group; Q4 is the highest.
window = Window.orderBy(col("gdp_per_capita"))

grouped = valid.withColumn("gdp_quartile", ntile(4).over(window))

quartile_summary = grouped.groupBy("gdp_quartile").agg(
    count("*").alias("country_year_records"),
    spark_round(avg("gdp_per_capita"), 2).alias("avg_gdp_per_capita"),
    spark_round(
        avg("plastic_waste_kg_person_day"), 4
    ).alias("avg_plastic_waste_kg_person_day"),
    spark_round(
        avg("mismanaged_waste_per_person"), 4
    ).alias("avg_mismanaged_waste_per_person"),
    spark_round(avg("population"), 0).alias("avg_population")
).orderBy("gdp_quartile")

print("\n=== WASTE BY GDP QUARTILE ===")
quartile_summary.show(truncate=False)

# Country-level comparison table
country_summary = valid.select(
    "Entity",
    "Code",
    "Year",
    "gdp_per_capita",
    "population",
    "plastic_waste_kg_person_day",
    "mismanaged_waste_per_person"
).orderBy(col("plastic_waste_kg_person_day").desc())

print("\n=== TOP 10 COUNTRIES BY PER-CAPITA PLASTIC WASTE ===")
country_summary.show(10, truncate=False)

# Yearly averages, useful if the source later contains multiple years
year_summary = valid.groupBy("Year").agg(
    count("*").alias("country_year_records"),
    spark_round(
        avg("plastic_waste_kg_person_day"), 4
    ).alias("avg_plastic_waste_kg_person_day"),
    spark_round(
        avg("mismanaged_waste_per_person"), 4
    ).alias("avg_mismanaged_waste_per_person"),
    spark_round(avg("gdp_per_capita"), 2).alias("avg_gdp_per_capita")
).orderBy("Year")

print("\n=== YEARLY SUMMARY ===")
year_summary.show(100, truncate=False)


def save_results(df, name):
    parquet_path = OUT / f"{name}_parquet"
    csv_path = OUT / f"{name}_csv"

    df.write.mode("overwrite").parquet(str(parquet_path))
    df.coalesce(1).write.mode("overwrite").option(
        "header", True
    ).csv(str(csv_path))

    print(f"Saved: {parquet_path}")
    print(f"Saved: {csv_path}")


save_results(valid, "plastic_gdp_country_comparison")
save_results(quartile_summary, "plastic_gdp_quartile_summary")
save_results(country_summary, "plastic_gdp_country_ranking")
save_results(year_summary, "plastic_gdp_year_summary")

print("\nORCA GDP comparison analysis completed.")
spark.stop()
