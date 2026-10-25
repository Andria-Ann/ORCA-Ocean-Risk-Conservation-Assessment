# Manual Test Sequence: HBase Marine Risk

Run from the project folder. The table is `marine_risk_ns:marine_risk`.

> The "Expected" blocks show the typical HBase 2.x shell format. They are **not** results from your computer. Timestamps (`<ts>`) and `Took x seconds` lines will differ. Your actual output is the real result, so compare it with the pass condition.

Run the tests in order. Each one depends on the earlier ones.

---

## Test 1: Namespace creation

```
create_namespace 'marine_risk_ns'
list_namespace
```
**Expected:** a `Took …` line for the create. The list includes:
```
NAMESPACE
default
hbase
marine_risk_ns
```
**Verify:** `marine_risk_ns` is in the list. Running `create_namespace` a second time gives a "Namespace already exists" error. That also confirms it exists.

## Test 2: Table creation

```
create 'marine_risk_ns:marine_risk', {NAME => 'info', VERSIONS => 1}, {NAME => 'metrics', VERSIONS => 3}, {NAME => 'analysis', VERSIONS => 1}
exists 'marine_risk_ns:marine_risk'
describe 'marine_risk_ns:marine_risk'
```
**Expected:**
```
Table marine_risk_ns:marine_risk does exist
...
COLUMN FAMILIES DESCRIPTION
{NAME => 'analysis', VERSIONS => '1', ...}
{NAME => 'info', VERSIONS => '1', ...}
{NAME => 'metrics', VERSIONS => '3', ...}
```
**Verify:** exactly 3 families, and `metrics` shows `VERSIONS => '3'`.

## Test 3: Data insertion

Run the whole of `02_insert_data.hbase` (or paste it into the shell), then:
```
count 'marine_risk_ns:marine_risk'
```
**Expected:**
```
12 row(s)
```
**Verify:** 12 = 8 countries + 3 World years + 1 demo row.

## Test 4: Record retrieval (get)

```
get 'marine_risk_ns:marine_risk', 'IND#2010'
```
**Expected (13 cells):**
```
COLUMN                                  CELL
 analysis:mismanaged_risk_category      timestamp=<ts>, value=MEDIUM
 analysis:risk_basis                    timestamp=<ts>, value=share_pct_threshold_v1
 info:country_name                      timestamp=<ts>, value=India
 info:data_status                       timestamp=<ts>, value=dataset_copy
 info:iso3                              timestamp=<ts>, value=IND
 info:record_type                       timestamp=<ts>, value=country_year
 info:source                            timestamp=<ts>, value=workbook: mismanaged_waste + per_capita sheets
 info:year                              timestamp=<ts>, value=2010
 metrics:gdp_per_capita_ppp             timestamp=<ts>, value=4404.697005
 metrics:mismanaged_waste_share_pct     timestamp=<ts>, value=1.8836
 metrics:per_capita_mismanaged          timestamp=<ts>, value=0.009
 metrics:per_capita_plastic_waste       timestamp=<ts>, value=0.01
 metrics:population                     timestamp=<ts>, value=1234280960
1 row(s)
```
Selected columns:
```
get 'marine_risk_ns:marine_risk', 'IND#2010', {COLUMNS => ['info:country_name', 'metrics:mismanaged_waste_share_pct']}
```
**Expected:** only 2 cells, `info:country_name` = `India` and `metrics:mismanaged_waste_share_pct` = `1.8836`, then `1 row(s)`.

**Verify:** compare `1.8836` with India's 2010 value in the workbook sheet `cleaned_mismanaged_waste_global`.

Year lookup:
```
get 'marine_risk_ns:marine_risk', 'OWID_WRL#2015'
```
**Expected:** `metrics:global_plastics_production_mt` = `381` among 7 cells.

## Test 5: Table scan

```
scan 'marine_risk_ns:marine_risk', {COLUMNS => ['info:country_name']}
```
**Expected (key order is byte-wise alphabetical):**
```
ROW                 COLUMN+CELL
 AUS#2010           column=info:country_name, timestamp=<ts>, value=Australia
 CHN#2010           column=info:country_name, timestamp=<ts>, value=China
 IDN#2010           column=info:country_name, timestamp=<ts>, value=Indonesia
 IND#2010           column=info:country_name, timestamp=<ts>, value=India
 LKA#2010           column=info:country_name, timestamp=<ts>, value=Sri Lanka
 OWID_WRL#2013      column=info:country_name, timestamp=<ts>, value=World
 OWID_WRL#2014      column=info:country_name, timestamp=<ts>, value=World
 OWID_WRL#2015      column=info:country_name, timestamp=<ts>, value=World
 PHL#2010           column=info:country_name, timestamp=<ts>, value=Philippines
 USA#2010           column=info:country_name, timestamp=<ts>, value=United States
 VNM#2010           column=info:country_name, timestamp=<ts>, value=Vietnam
 ZZZ#2010           column=info:country_name, timestamp=<ts>, value=Demo Country
12 row(s)
```
**Verify:** 12 rows, and `IDN` comes before `IND` (D sorts before N).

Range scan:
```
scan 'marine_risk_ns:marine_risk', {STARTROW => 'IDN#2010', STOPROW => 'LKA#2011', COLUMNS => ['info:country_name']}
```
**Expected:** 3 rows (`IDN#2010`, `IND#2010`, `LKA#2010`). **Verify:** `STOPROW` is exclusive, and `LKA#2010` falls before `LKA#2011`.

```
scan 'marine_risk_ns:marine_risk', {STARTROW => 'OWID_WRL#2013', STOPROW => 'OWID_WRL#2016', COLUMNS => ['metrics:global_plastics_production_mt']}
```
**Expected:** 3 rows with values `352`, `367`, `381`.

## Test 6: Filters

| Command (after `scan 'marine_risk_ns:marine_risk', {FILTER => …}`) | Expected rows |
|---|---|
| `"PrefixFilter('OWID_WRL')"` | 3 (`OWID_WRL#2013`, `#2014`, `#2015`) |
| `"RowFilter(=, 'regexstring:.*#2010$')"` | 9 (8 countries + `ZZZ#2010`) |
| `"SingleColumnValueFilter('analysis','mismanaged_risk_category',=,'binary:HIGH',true,true)"` | 4 (`CHN`, `IDN`, `PHL`, `VNM`) |
| `"ValueFilter(=, 'substring:India')"` | 1 (`IND#2010`, `info:country_name`) |
| `"PrefixFilter('I') AND SingleColumnValueFilter('analysis','mismanaged_risk_category',=,'binary:MEDIUM',true,true)"` | 1 (`IND#2010`) |

**Verify:** each row count matches. The HIGH list must match the labels in the README example table.

## Test 7: Update

```
get 'marine_risk_ns:marine_risk', 'ZZZ#2010', {COLUMN => 'metrics:population'}
put 'marine_risk_ns:marine_risk', 'ZZZ#2010', 'metrics:population', '1200000'
get 'marine_risk_ns:marine_risk', 'ZZZ#2010', {COLUMN => 'metrics:population'}
get 'marine_risk_ns:marine_risk', 'ZZZ#2010', {COLUMN => 'metrics:population', VERSIONS => 3}
```
**Expected:**
```
 metrics:population     timestamp=<ts1>, value=1000000      (before)
 metrics:population     timestamp=<ts2>, value=1200000      (after)
 metrics:population     timestamp=<ts2>, value=1200000      (VERSIONS => 3)
 metrics:population     timestamp=<ts1>, value=1000000
```
**Verify:** the plain `get` shows only `1200000`. The `VERSIONS => 3` query shows both values, newest first. If both `put`s land in the same millisecond, the second can overwrite the first and only one version shows. Wait a second between them if that happens.

## Test 8: Deletion

Cell delete:
```
delete 'marine_risk_ns:marine_risk', 'ZZZ#2010', 'metrics:gdp_per_capita_ppp'
get 'marine_risk_ns:marine_risk', 'ZZZ#2010', {COLUMN => 'metrics:gdp_per_capita_ppp'}
```
**Expected:** the `get` shows `COLUMN  CELL` with no cells, then `0 row(s)`. **Verify:** `get 'marine_risk_ns:marine_risk', 'ZZZ#2010'` still returns the other 12 cells.

Row delete:
```
deleteall 'marine_risk_ns:marine_risk', 'ZZZ#2010'
get 'marine_risk_ns:marine_risk', 'ZZZ#2010'
count 'marine_risk_ns:marine_risk'
```
**Expected:** `0 row(s)` for the get, and `11 row(s)` for the count. **Verify:** `ZZZ#2010` is missing from a full `scan`, and the 11 real rows are untouched.

## Test 9: Nonexistent records

```
get 'marine_risk_ns:marine_risk', 'IND#1999'
get 'marine_risk_ns:marine_risk', 'XXX#2010'
scan 'marine_risk_ns:marine_risk', {ROWPREFIXFILTER => 'NOPE'}
get 'marine_risk_ns:nonexistent_table', 'IND#2010'
```
**Expected:**
```
COLUMN        CELL
0 row(s)
```
for the first three. The fourth gives an error such as `TableNotFoundException: marine_risk_ns:nonexistent_table`.

**Verify:** a missing row is **not** an error in HBase, just an empty result. A missing table is an error.

## Test 10: Disable and enable

```
disable 'marine_risk_ns:marine_risk'
is_disabled 'marine_risk_ns:marine_risk'
enable 'marine_risk_ns:marine_risk'
is_enabled 'marine_risk_ns:marine_risk'
count 'marine_risk_ns:marine_risk'
```
**Expected:** `true` for `is_disabled`, then `true` for `is_enabled`, then `11 row(s)` (after Test 8; use 12 if you skipped it). **Verify:** data survives disable and enable.

## Cleanup (only when you want to start over)

```
disable 'marine_risk_ns:marine_risk'
drop 'marine_risk_ns:marine_risk'
drop_namespace 'marine_risk_ns'
list_namespace
```
**Expected:** `marine_risk_ns` is no longer listed. `drop` fails on an enabled table, which is why `disable` comes first. Dropping the namespace fails while it still contains tables.
