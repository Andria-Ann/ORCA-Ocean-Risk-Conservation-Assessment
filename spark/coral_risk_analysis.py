from pathlib import Path
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

BASE = Path.home() / "ORCA"
INPUT = BASE / "data" / "coral_cleaned.csv"
OUTPUT = BASE / "outputs" / "coral_risk_by_site"

spark = (
    SparkSession.builder
    .appName("ORCA-Coral-Risk-Analysis")
    .master("local[*]")
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")

try:
    if not INPUT.exists():
        raise FileNotFoundError(f"Missing input file: {INPUT}")

    df = (
        spark.read
        .option("header", "true")
        .option("inferSchema", "true")
        .csv(str(INPUT))
    )

    # Aggregate observed measurements for each reef site.
    site_summary = (
        df.groupBy("site_name")
        .agg(
            F.count("*").alias("observation_count"),
            F.avg("temperature_celsius").alias("avg_temperature_c"),
            F.avg("ssta").alias("avg_temperature_anomaly"),
            F.avg("dhw_stress").alias("avg_dhw_stress"),
            F.max("dhw_stress").alias("max_dhw_stress"),
            F.avg("bleaching_percent").alias("avg_bleaching_percent"),
            F.max("bleaching_percent").alias("max_bleaching_percent"),
            F.avg("dissolved_o2").alias("avg_dissolved_oxygen"),
            F.avg("ph").alias("avg_ph"),
            F.avg("chlorophyll_a_mg_m3").alias("avg_chlorophyll_a"),
            F.avg("turbidity_ntu").alias("avg_turbidity")
        )
    )

    # Transparent screening bands, not a validated ecological diagnosis.
    site_summary = site_summary.withColumn(
        "heat_stress_screen",
        F.when(F.col("max_dhw_stress") >= 8, "High")
         .when(F.col("max_dhw_stress") >= 4, "Elevated")
         .when(F.col("max_dhw_stress").isNull(), "Unknown")
         .otherwise("Lower")
    )

    site_summary = site_summary.withColumn(
        "bleaching_screen",
        F.when(F.col("avg_bleaching_percent") >= 30, "Higher")
         .when(F.col("avg_bleaching_percent") >= 10, "Moderate")
         .when(F.col("avg_bleaching_percent").isNull(), "Unknown")
         .otherwise("Lower")
    )

    site_summary.orderBy(
        F.col("max_dhw_stress").desc_nulls_last()
    ).show(50, truncate=False)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    site_summary.write.mode("overwrite").option(
        "header", "true"
    ).csv(str(OUTPUT) + "_csv")

    site_summary.write.mode("overwrite").parquet(str(OUTPUT))

    print("Analysis complete.")
    print("CSV output folder:", str(OUTPUT) + "_csv")
    print("Parquet output folder:", OUTPUT)

finally:
    spark.stop()
