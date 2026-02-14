# CareerOS

FastAPI backend with JSON persistence.

## Run

### Backend

1) Install dependencies:

   pip install -r requirements.txt

2) Start the server:

   uvicorn app.main:app --reload

### Frontend

1) Install dependencies:

```bash
cd frontend
npm install
```

2) Start the dev server:

```bash
npm run dev
```

3) Open http://localhost:5173 in your browser.

#### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

Create a `.env` file in `frontend/` to override:

```
VITE_API_URL=http://localhost:8000
```

## Endpoints

- GET /health
- POST /submit-task
- POST /analyze-profile
- POST /analyze-role
- POST /generate-roadmap

## Scripts

### Process LinkedIn Dataset

Extract skill demand frequency from LinkedIn Job Postings dataset:

```bash
python scripts/process_linkedin_dataset.py <input_csv> [--output <output_json>]
```

Example:

```bash
python scripts/process_linkedin_dataset.py data/linkedin_jobs.csv
```

Output: `app/data/market_skills.json`
