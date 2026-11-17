"""
DAH Dashboard ETL — Animal Husbandry, Fisheries & Co-Operatives
Reads 'animal husbandry KPI data template.xlsx' + 'gujarat_region_mapping.xlsx'
and writes one JSON per AIRD sheet into public/data/.

Run: python scripts/dah_etl.py
"""

import json
import os
import re
import sys
import unicodedata

import openpyxl

# ────────────────────────────────────────────
# PATHS
# ────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
WORKBOOK_PATH = os.path.join(ROOT_DIR, "animal husbandry KPI data template.xlsx")
REGION_MAP_PATH = os.path.join(ROOT_DIR, "gujarat_region_mapping.xlsx")
OUTPUT_DIR = os.path.join(ROOT_DIR, "public", "data")

os.makedirs(OUTPUT_DIR, exist_ok=True)

SHEET_CODES = [
    "AIRD-06", "AIRD-07", "AIRD-08", "AIRD-09", "AIRD-10", "AIRD-11",
    "AIRD-15", "AIRD-17", "AIRD-22", "AIRD-23_1", "AIRD-23_2", "AIRD-23_3",
    "AIRD-24", "AIRD-36", "AIRD-37_1", "AIRD-37_2", "AIRD-50", "AIRD-51",
    "AIRD-54", "AIRD-55_1", "AIRD-55_2", "AIRD-63", "AIRD-71", "AIRD-81",
    "AIRD-93",
]

# LAST_REPORTED_FY — actuals after this FY must be nulled
LAST_REPORTED_FY = "2025-26"

NULL_STRINGS = {"", "-", "nil", "na", "NIL", "NA", "'NIL'", "'-'"}


# ────────────────────────────────────────────
# HELPERS
# ────────────────────────────────────────────
def normalise_header(h):
    """Collapse NBSP, zero-width chars, multi-spaces, strip."""
    if h is None:
        return None
    s = str(h)
    # Remove zero-width chars
    s = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", s)
    # NBSP -> space
    s = s.replace("\xa0", " ")
    # Collapse multi-space
    s = re.sub(r"\s+", " ", s).strip()
    return s


def to_snake(s):
    """Convert header string to snake_case."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = s.strip("_")
    return s


def clean_value(v):
    """Normalise null-like values."""
    if v is None:
        return None
    if isinstance(v, str):
        v = v.strip()
        if v.lower() in {"", "-", "nil", "na", "'nil'", "'-'"}:
            return None
        return v
    return v


def fy_to_start_year(fy_str):
    """'2025-26' -> 2025"""
    if not fy_str or not isinstance(fy_str, str):
        return 0
    parts = fy_str.split("-")
    try:
        return int(parts[0])
    except ValueError:
        return 0


def fy_after_last_reported(fy_str):
    """Returns True if fy > LAST_REPORTED_FY."""
    return fy_to_start_year(fy_str) > fy_to_start_year(LAST_REPORTED_FY)


# ────────────────────────────────────────────
# LOAD REGION MAPPING
# ────────────────────────────────────────────
def load_region_mapping():
    wb = openpyxl.load_workbook(REGION_MAP_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    wb.close()
    mapping = {}
    for region, district, code in rows:
        if code is not None:
            mapping[str(int(code) if isinstance(code, (int, float)) else code)] = {
                "region": str(region).strip() if region else None,
                "district": str(district).strip() if district else None,
            }
    return mapping


# ────────────────────────────────────────────
# GENERIC SHEET READER
# ────────────────────────────────────────────
def read_sheet(wb, sheet_name, region_map):
    ws = wb[sheet_name]
    raw_headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]

    # Normalise headers
    headers = []
    for h in raw_headers:
        nh = normalise_header(h)
        if nh is None:
            headers.append(None)
        else:
            headers.append(nh)

    # Build snake_case keys
    keys = []
    for h in headers:
        if h is None:
            keys.append(None)
        else:
            keys.append(to_snake(h))

    rows_out = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        vals = list(row)

        # Drop fully blank rows
        if all(v is None or (isinstance(v, str) and v.strip() == "") for v in vals):
            continue

        rec = {}
        for i, v in enumerate(vals):
            if i >= len(keys) or keys[i] is None:
                continue
            rec[keys[i]] = clean_value(v)

        # Must have FY (skip rows with null FY)
        fy_key = "fy"
        if fy_key not in rec or rec[fy_key] is None:
            # Check if there's a 'quarter' key for quarterly sheets
            if "quarter" not in rec or rec.get(fy_key) is None:
                continue

        # Normalise State field
        if "state" in rec and rec["state"]:
            s = str(rec["state"]).strip()
            # Fix typo 'Gujar`at' -> 'Gujarat'
            s = s.replace("`", "")
            if s.lower().startswith("gujar"):
                s = "Gujarat"
            rec["state"] = s

        # Null actuals after LAST_REPORTED_FY
        fy_val = rec.get(fy_key)
        if fy_val and fy_after_last_reported(fy_val):
            for k in list(rec.keys()):
                if k.startswith("actual"):
                    rec[k] = None

        # Join region mapping for district sheets
        dc = rec.get("district_code")
        if dc is not None:
            dc_str = str(int(dc)) if isinstance(dc, (int, float)) else str(dc).strip()
            rec["district_code"] = dc_str
            if dc_str in region_map:
                rec["region"] = region_map[dc_str]["region"]
            else:
                rec["region"] = None

        rows_out.append(rec)

    return rows_out


# ────────────────────────────────────────────
# SHEET-SPECIFIC POST-PROCESSING
# ────────────────────────────────────────────
def post_process(sheet_code, rows):
    """Apply sheet-specific cleaning rules."""

    if sheet_code == "AIRD-22":
        # AIRD-22: Actual % stored as fractions (0.4669 = 46.69%)
        # Multiply actual percents by 100
        # Also: from 2025-26 onward, actual 0 values are placeholder -> null
        for r in rows:
            fy = r.get("fy")
            fy_start = fy_to_start_year(fy)

            # Actual % milk procurement
            ak1 = "actual_percent_milk_procurement_in_organized_sector_over_total_milk_production"
            if ak1 in r and r[ak1] is not None:
                v = r[ak1]
                if isinstance(v, (int, float)):
                    if fy_start >= 2025 and v == 0:
                        # ASSUMPTION: AIRD-22 actual placeholders (0 from 2025-26 on) treated as null
                        r[ak1] = None
                    elif v < 1:  # It's a fraction
                        r[ak1] = v * 100
                    # else keep as-is

            # Actual % milk processing capacity
            ak2 = "actual_percent_milk_processing_capacity_over_total_milk_production"
            if ak2 in r and r[ak2] is not None:
                v = r[ak2]
                if isinstance(v, (int, float)):
                    if fy_start >= 2025 and v == 0:
                        r[ak2] = None
                    elif v < 1:
                        r[ak2] = v * 100

    if sheet_code == "AIRD-06":
        # AIRD-06: Stray actual 0 in 2029-30 already nulled by fy_after_last_reported
        pass

    if sheet_code == "AIRD-50":
        # Drop rows where FY is null (stray orphan cell)
        rows = [r for r in rows if r.get("fy") is not None]
        # Drop the stray row that has only a '7' in target refrigerated van with no FY
        # Already handled by the FY null check above

    if sheet_code == "AIRD-51":
        # NIL values already cleaned to null by clean_value
        # '-' values also cleaned to null
        pass

    return rows


# ────────────────────────────────────────────
# MAIN ETL
# ────────────────────────────────────────────
def main():
    print("Loading region mapping...")
    region_map = load_region_mapping()
    print(f"  {len(region_map)} districts mapped")

    print(f"Loading workbook: {WORKBOOK_PATH}")
    wb = openpyxl.load_workbook(WORKBOOK_PATH, read_only=True, data_only=True)
    print(f"  Sheets: {wb.sheetnames}")

    results = {}
    for code in SHEET_CODES:
        if code not in wb.sheetnames:
            print(f"  WARNING: Sheet '{code}' not found, skipping")
            continue

        rows = read_sheet(wb, code, region_map)
        rows = post_process(code, rows)

        out_path = os.path.join(OUTPUT_DIR, f"{code}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=None, default=str)

        results[code] = len(rows)
        print(f"  {code}: {len(rows)} rows -> {out_path}")

    wb.close()

    # Also write region mapping as JSON for potential future use
    region_out = os.path.join(OUTPUT_DIR, "region_mapping.json")
    with open(region_out, "w", encoding="utf-8") as f:
        json.dump(region_map, f, ensure_ascii=False, indent=2)
    print(f"  region_mapping: {len(region_map)} entries -> {region_out}")

    print("\nETL complete!")
    print(f"   Files written to: {OUTPUT_DIR}")
    for code, count in results.items():
        print(f"   {code}.json: {count} rows")


if __name__ == "__main__":
    main()
