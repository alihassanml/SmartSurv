import sqlite3
import json

conn = sqlite3.connect('smartsurv.db')
cursor = conn.cursor()
cursor.execute("SELECT id, timestamp, backend_ts, detections FROM alerts ORDER BY id DESC LIMIT 5")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, TS: {row[1]}, B_TS: {row[2]}, DET: {row[3][:50]}...")
conn.close()
