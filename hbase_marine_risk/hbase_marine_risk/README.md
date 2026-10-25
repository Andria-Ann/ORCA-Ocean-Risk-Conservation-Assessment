# HBase Component: Marine Risk Analysis Using Big Data Analytics and Data Mining

This folder holds only the Apache HBase part of the project. It assumes HBase is already running in standalone mode.

> **Important:** the "expected output" blocks in this folder show the typical HBase shell format. They were **not** captured from your machine. Timestamps, `Took x seconds` timings and minor spacing vary by HBase version. Your own output is the real result.

## 1. Purpose

Store country-level plastic-waste indicators and global plastics production as rows in HBase, so they can be fetched by key, scanned by range, filtered, updated and deleted.

**Scientific caution.**
- Plastics *production* is not ocean pollution.
- "Mismanaged waste share" is a *modelled estimate* of land-based waste that is at risk of reaching the sea. It is not a measurement of plastic in the ocean.
- The `analysis` risk labels are a simple demo rule defined in this project (see section 4). They are not an official risk score.

## 2. Folder structure

```
hbase_marine_risk/
├── README.md                        (this file)
├── TESTING.md                       full manual test sequence
├── 01_create_namespace_table.hbase
├── 02_insert_data.hbase             12 rows, 138 puts
├── 03_read_queries.hbase            get / scan / columns / ranges
├── 04_filters.hbase                 row-key, value, column, combined filters
├── 05_update_delete.hbase           update, cell delete, row delete
├── 06_table_management.hbase        disable / enable / describe namespace
└── 07_cleanup.hbase                 DESTRUCTIVE: drops table and namespace
```

Run a script with `hbase shell 01_create_namespace_table.hbase`, or paste its lines into an open `hbase shell`.

## 3. HBase's role and architecture

HBase is the project's storage layer for the structured marine-risk records.

- Data lives in a **namespace** (`marine_risk_ns`), which holds **tables**.
- A table has **rows** sorted by **row key**.
- Each row has cells grouped into **column families**. Within a family, **qualifiers** name individual columns, so the full column name is `family:qualifier`.
- A cell can hold several timestamped **versions**.
- **Standalone mode:** one JVM runs the HBase Master, a RegionServer and a ZooKeeper instance, and stores data on the local file system, not on HDFS. A separate Hadoop/HDFS cluster is therefore not needed. Fully distributed HBase uses HDFS for replicated storage.

## 4. Table schema

Table `marine_risk_ns:marine_risk`.

| Family | VERSIONS | Qualifiers | Meaning |
|---|---|---|---|
| `info` | 1 | `country_name`, `iso3`, `year`, `record_type`, `source`, `data_status` | Identity and provenance |
| `metrics` | 3 | `mismanaged_waste_share_pct`, `per_capita_mismanaged`, `per_capita_plastic_waste`, `gdp_per_capita_ppp`, `population`, `global_plastics_production_mt` | Numbers taken from the workbook |
| `analysis` | 1 | `mismanaged_risk_category`, `risk_basis` | Derived demo label |

Notes:
- Rows are *sparse*. Country rows have no `global_plastics_production_mt`, and World rows have only that metric. HBase stores no empty cells.
- `data_status` is `dataset_copy` (copied by hand from your workbook, not re-verified) or `illustrative` (invented).
- **Demo risk rule** (`risk_basis = share_pct_threshold_v1`): `mismanaged_waste_share_pct` of 5 or more is `HIGH`, 1 up to 5 is `MEDIUM`, below 1 is `LOW`. The thresholds are an arbitrary teaching choice.
- Units follow the workbook sheets. `mismanaged_waste_share_pct` is the % of the global total. The per-capita sheet headers do not state a unit, so check them before quoting a unit in your report.
- Production is in million tonnes (`_mt`).

## 5. Row-key design

Format: `<ISO3 or OWID code>#<4-digit year>`

Examples: `IND#2010`, `CHN#2010`, `OWID_WRL#2015`.

Why it fits:
- **No collisions.** The code is unique per entity and the year is unique per observation, so a key identifies exactly one entity-year.
- **Fast point lookup.** `get 'IND#2010'` goes straight to one row.
- **Range scans work.** Rows sort lexicographically, so all years of one entity are adjacent (`OWID_WRL#2013` to `OWID_WRL#2015`). Fixed-width years keep the order correct.
- **Readable.** Keys match the `Code` and `Year` columns in your workbook.

Trade-off: finding "all countries in year 2010" cannot use a key range. It needs a full-table regex `RowFilter` (query 3 in `04_filters.hbase`). That is fine at this size. For large data, a second table keyed `<year>#<code>` would be used.

## 6. Command reference

Table `T` is `'marine_risk_ns:marine_risk'`.

| Task | Command |
|---|---|
| Create namespace | `create_namespace 'marine_risk_ns'` |
| Create table | `create T, {NAME=>'info',VERSIONS=>1}, {NAME=>'metrics',VERSIONS=>3}, {NAME=>'analysis',VERSIONS=>1}` |
| List namespaces / tables | `list_namespace`, `list_namespace_tables 'marine_risk_ns'`, `list 'marine_risk_ns:.*'` |
| Describe | `describe T` |
| Insert / update a cell | `put T, 'IND#2010', 'info:country_name', 'India'` |
| Get a row | `get T, 'IND#2010'` |
| Get selected columns | `get T, 'IND#2010', {COLUMNS=>['info:country_name','metrics:population']}` |
| Scan everything | `scan T` |
| Scan a key range | `scan T, {STARTROW=>'IDN#2010', STOPROW=>'LKA#2011'}` |
| Filter | `scan T, {FILTER=>"PrefixFilter('IND')"}` |
| Delete a cell | `delete T, 'ZZZ#2010', 'metrics:population'` |
| Delete a row | `deleteall T, 'ZZZ#2010'` |
| Disable / enable | `disable T`, `enable T` |
| Drop table / namespace | `disable T`, `drop T`, `drop_namespace 'marine_risk_ns'` |

Row-key filtering vs value filtering:
- **Row-key filters** (`PrefixFilter`, `RowFilter`, `STARTROW`/`STOPROW`) look only at the row key. `STARTROW`/`STOPROW` and `PrefixFilter` jump straight to the right place, so they are fast. `RowFilter` with a regex still reads every row.
- **Value filters** (`SingleColumnValueFilter`, `ValueFilter`) look inside cells. HBase must read every candidate row and test its data, so they are slower and always scan widely.
- Both filter on the server, so only matching rows travel back to the client.
- **Values are stored as text.** Comparisons such as `binary:` are therefore text comparisons, not numeric ones: `'5.7'` sorts after `'27.6'`. Use value filters for exact or substring matches, and keep numeric logic for the analysis tools.

## 7. Example data (2010 values copied from the workbook)

| Row key | Country | Mismanaged waste share (% global) | Demo risk label |
|---|---|---|---|
| `CHN#2010` | China | 27.6966 | HIGH |
| `IDN#2010` | Indonesia | 10.1019 | HIGH |
| `PHL#2010` | Philippines | 5.9153 | HIGH |
| `VNM#2010` | Vietnam | 5.7588 | HIGH |
| `LKA#2010` | Sri Lanka | 4.9968 | MEDIUM |
| `IND#2010` | India | 1.8836 | MEDIUM |
| `USA#2010` | United States | 0.8649 | LOW |
| `AUS#2010` | Australia | 0.0436 | LOW |
| `OWID_WRL#2013/14/15` | World | production 352 / 367 / 381 million tonnes | no label |
| `ZZZ#2010` | Demo Country | **illustrative, invented** | LOW |

Always say "dataset copy, not independently verified" when quoting these. Check them against the workbook sheets before submitting.

## 8. Testing procedure (summary)

Full commands, expected results and verification steps are in `TESTING.md`.

| # | Test | Pass condition |
|---|---|---|
| 1 | Namespace creation | `marine_risk_ns` appears in `list_namespace` |
| 2 | Table creation | `exists` returns true. `describe` shows 3 families |
| 3 | Insertion | `count` returns 12 |
| 4 | Retrieval (get) | `IND#2010` returns 13 cells with `country_name=India` |
| 5 | Scan | 12 rows, in key order |
| 6 | Update | New value appears, old one kept as a version |
| 7 | Deletion | Cell gone. Row gone. `count` returns 11 |
| 8 | Nonexistent record | `get 'IND#1999'` returns 0 row(s), no error |

## 9. Known limitations

- Values are stored as strings. There are no numeric comparisons and no typed schema.
- Only 12 sample rows are included. The workbook has far more rows, and bulk loading is deliberately out of scope here.
- Only one year (2010) exists for the country indicators in the workbook sheets used. Production data has world totals only.
- The risk label is a demo rule, and modelled waste shares are not ocean measurements.
- HBase has no joins, no SQL and no secondary indexes. Queries by year or by risk label scan many rows.
- Standalone mode offers no replication or fault tolerance.
- The shell is for demonstration. Application access is out of scope.

## 10. Viva preparation

**What is Apache HBase?** An open-source, distributed, column-family NoSQL database modelled on Google Bigtable. It stores sorted, sparse, versioned data and gives fast random reads and writes.

**Why is it suitable here?** Marine data is sparse, since different record types have different columns. It is time-stamped, and it is looked up by entity and year. Row-key lookups and range scans are HBase's strengths, and it scales to far larger data than this sample.

**Namespace, table, row, column family, qualifier?**
- Namespace: a group of tables, like a schema or database.
- Table: a collection of rows.
- Row: one record, identified by its row key.
- Column family: a group of columns stored together. It is fixed when the table is created.
- Qualifier: the column name inside a family. It can be added freely. A cell is addressed as `family:qualifier`.

**What is a row key?** The unique, byte-sorted identifier of a row. It is the only built-in index, so schema design is mostly row-key design.

**put / get / scan / delete?**
- `put` writes or updates a cell. An update adds a new version.
- `get` reads one row by key.
- `scan` reads many rows in key order, optionally with a range, columns or filters.
- `delete` removes a cell, and `deleteall` removes a whole row. Both write tombstone markers, and the data is physically removed later during compaction.

**HBase vs a relational database?** HBase has no fixed columns per row, no joins or SQL, and no foreign keys. It is built for huge sparse tables with key-based access, and it scales out. A relational database has a fixed schema, joins, SQL and strong multi-row transactions.

**What is standalone HBase?** All HBase services (Master, RegionServer and ZooKeeper) run in one JVM on one machine, using the local file system. It is meant for learning and development.

**Why no Hadoop/HDFS cluster in standalone mode?** Because HDFS provides replicated, distributed storage across many machines. A single-process setup writes to the local disk, so it has nothing to distribute or replicate.
