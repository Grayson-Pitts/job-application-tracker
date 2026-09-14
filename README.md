# Job Application Tracker

A full-stack web application for tracking internship and job applications. Users can add opportunities, search/filter applications, update statuses, store notes and posting links, and delete entries. Data is persisted in SQLite through a Flask REST API.

## Tech stack
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Python + Flask
- **Database:** SQLite
- **API:** REST-style JSON endpoints

## Features
- Add and persist job applications
- Search by company or role
- Filter by application status
- Update application status without reloading the page
- Delete applications
- Dashboard counts for visible applications, interviews, and offers
- Responsive interface

## Run locally

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000`.

## API
- `GET /api/applications` — list/search/filter applications
- `POST /api/applications` — create an application
- `PATCH /api/applications/<id>` — update an application
- `DELETE /api/applications/<id>` — delete an application

## Possible next steps
- User authentication
- Editing all application fields
- Follow-up reminders
- Sortable tables and analytics
- PostgreSQL deployment
- Automated tests
