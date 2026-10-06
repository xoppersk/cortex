"""Run Cortex Supabase migrations + seed + RLS tests. DB password via env SUPABASE_DB_PASSWORD."""
import os, sys, glob
import psycopg2

HOST = "127.0.0.1"
PORT = 15432
BASE = os.path.expanduser("~/workspace/builds/cortex/supabase")

def run_file(cur, path, label):
    with open(path) as f:
        sql = f.read()
    cur.execute(sql)
    print(f"  OK {label}", flush=True)

def main():
    pwd = os.environ.get("SUPABASE_DB_PASSWORD")
    if not pwd:
        print("SUPABASE_DB_PASSWORD not set"); sys.exit(1)
    tests_only = "--tests-only" in sys.argv
    conn = psycopg2.connect(host=HOST, port=PORT, dbname="postgres",
                            user="postgres", password=pwd, connect_timeout=30)
    conn.autocommit = True
    cur = conn.cursor()
    if not tests_only:
        # Preamble: 00002 failed partway on the first attempt (FK ordering bug,
        # now fixed). Its columns are idempotent (IF NOT EXISTS) but the check
        # constraint is not — drop it so the fixed file re-runs cleanly.
        cur.execute("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_default_temperature_check;")
        cur.execute("ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_team_fk;")
        print("  preamble: dropped partial 00002 constraints (if any)", flush=True)
    try:
        if not tests_only:
            print("== migrations ==")
            for path in sorted(glob.glob(f"{BASE}/migrations/*.sql")):
                run_file(cur, path, os.path.basename(path))
            print("== seed ==")
            run_file(cur, f"{BASE}/seed.sql", "seed.sql")
        print("== RLS tests ==")
        for name in ["helpers.sql", "rls_core.sql", "rls_policies.sql", "rls_rag.sql"]:
            run_file(cur, f"{BASE}/tests/{name}", f"tests/{name}")
            if name == "helpers.sql":
                # Test files SET ROLE authenticated; that role needs USAGE on
                # the tests schema and EXECUTE on its helper functions.
                cur.execute("GRANT USAGE ON SCHEMA tests TO authenticated, anon;")
                cur.execute("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO authenticated, anon;")
                print("  granted tests-schema access to authenticated/anon", flush=True)
        print("ALL GREEN")
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {str(e)[:600]}")
        sys.exit(1)
    finally:
        cur.close(); conn.close()

main()
