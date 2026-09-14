from flask import Flask, jsonify, render_template, request
import sqlite3
from pathlib import Path

app = Flask(__name__)
DB_PATH = Path(__file__).with_name("applications.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Applied',
                date_applied TEXT,
                link TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/applications")
def list_applications():
    status = request.args.get("status", "").strip()
    search = request.args.get("search", "").strip()

    query = "SELECT * FROM applications WHERE 1=1"
    params = []

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if search:
        query += " AND (company LIKE ? OR role LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard])

    query += " ORDER BY created_at DESC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/applications")
def create_application():
    data = request.get_json(silent=True) or {}
    company = data.get("company", "").strip()
    role = data.get("role", "").strip()

    if not company or not role:
        return jsonify({"error": "Company and role are required."}), 400

    values = (
        company,
        role,
        data.get("status", "Applied"),
        data.get("date_applied", ""),
        data.get("link", "").strip(),
        data.get("notes", "").strip(),
    )

    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO applications (company, role, status, date_applied, link, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            values,
        )
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?", (cur.lastrowid,)
        ).fetchone()

    return jsonify(dict(row)), 201


@app.patch("/api/applications/<int:application_id>")
def update_application(application_id):
    data = request.get_json(silent=True) or {}
    allowed = {"company", "role", "status", "date_applied", "link", "notes"}
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "No valid fields supplied."}), 400

    set_clause = ", ".join(f"{key} = ?" for key in updates)
    values = list(updates.values()) + [application_id]

    with get_db() as conn:
        cur = conn.execute(
            f"UPDATE applications SET {set_clause} WHERE id = ?", values
        )
        if cur.rowcount == 0:
            return jsonify({"error": "Application not found."}), 404
        row = conn.execute(
            "SELECT * FROM applications WHERE id = ?", (application_id,)
        ).fetchone()

    return jsonify(dict(row))


@app.delete("/api/applications/<int:application_id>")
def delete_application(application_id):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM applications WHERE id = ?", (application_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Application not found."}), 404
    return "", 204


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
else:
    init_db()
