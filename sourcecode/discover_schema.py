"""Quick schema discovery — lists all tables and their columns from Azure SQL."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app.application.db_service import _get_conn, _sql_rows

conn = _get_conn()
if not conn:
    print("❌ Could not connect to Azure SQL. Check your .env.")
    sys.exit(1)

print("✅ Connected!\n")

# List all user tables
tables = _sql_rows(
    "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
    "WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
)

print(f"{'SCHEMA':<15} {'TABLE'}")
print("-" * 50)
for t in tables:
    schema = t.get("TABLE_SCHEMA", "dbo")
    name   = t.get("TABLE_NAME", "")
    print(f"{schema:<15} {name}")

print(f"\nTotal: {len(tables)} tables\n")

# Show columns for each table
for t in tables:
    tname = t.get("TABLE_NAME")
    cols = _sql_rows(
        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_NAME=? ORDER BY ORDINAL_POSITION",
        (tname,)
    )
    col_str = ", ".join(f"{c['COLUMN_NAME']}({c['DATA_TYPE']})" for c in cols)
    print(f"  {tname}: {col_str}")
