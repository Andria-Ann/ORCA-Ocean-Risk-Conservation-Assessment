from pathlib import Path
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

DATA_DIR = Path.home() / "ORCA" / "data"
OUTPUT_DIR = Path.home() / "ORCA" / "outputs"

spark = (
    SparkSession.builder
    .appName("ORCA-Marine-Data-Processing")
    .master("local[*]")
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("WARN")

try:
    files = sorted(DATA_DIR.glob("*.csv"))

    if not files:
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = []

    for file in files:
        print(f"\n{'=' * 60}")
        print(f"DATASET: {file.name}")
        print("=" * 60)

        df = (
            spark.read
            .option("header", "true")
            .option("inferSchema", "true")
            .option("mode", "FAILFAST")
            .csv(str(file))
        )

        df.printSchema()
        df.show(5, truncate=False)

        rows = df.count()
        columns = len(df.columns)
        duplicates = rows - df.dropDuplicates().count()

        print("Rows:", rows)
        print("Columns:", columns)
        print("Exact duplicate rows:", duplicates)

        missing_exprs = []
        for name, dtype in df.dtypes:
            col = F.col(name)
            missing = col.isNull()

            if dtype == "string":
                missing = missing | (F.trim(col) == "")

            missing_exprs.append(
                F.sum(F.when(missing, 1).otherwise(0)).alias(name)
            )

        print("Missing values per column:")
        if missing_exprs:
            df.select(*missing_exprs).show(
                truncate=False, vertical=True
            )


        output_path = OUTPUT_DIR / f"{file.stem}_parquet"
        df.write.mode("overwrite").parquet(str(output_path))


        saved_rows = spark.read.parquet(str(output_path)).count()
        print("Saved Parquet:", output_path)
        print("Saved row count:", saved_rows)

        if rows != saved_rows:
            raise RuntimeError(
                f"Row-count mismatch for {file.name}: "
                f"{rows} original vs {saved_rows} saved"
            )

        summary.append((file.name, rows, columns, duplicates, saved_rows))

    print("\n\n========== ORCA PROCESSING SUMMARY ==========")
    for name, rows, columns, duplicates, saved_rows in summary:
        print(
            f"{name}: rows={rows}, columns={columns}, "
            f"duplicates={duplicates}, saved_rows={saved_rows}"
        )

    print("\nAll datasets processed successfully.")

finally:
    spark.stop()
