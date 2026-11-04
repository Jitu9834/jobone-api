# JobOne Phase 2 — API starter

This is a starter backend to proxy India job searches through Jobvetta without exposing your API key in browser code.

## Setup (local computer)
1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`; paste your private Jobvetta key into it.
3. In this folder run: `npm install`
4. Run: `npm start`
5. Open `http://localhost:3000/api/jobs?q=analyst&location=Pune`

## Important
- Do not publish `.env` or commit it to Git.
- Review Jobvetta's terms and obtain written confirmation of commercial display/redistribution rights before public monetization.
- This backend is a starter integration; it does not yet replace the prototype's demo cards.
- API responses and fields may change; test against current provider docs.
