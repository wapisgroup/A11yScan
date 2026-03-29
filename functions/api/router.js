// functions/api/router.js
const express = require('express');
const cors = require('cors');

const { apiKeyAuth } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { apiLogger } = require('./middleware/logger');

const projectsRouter = require('./routes/projects');
const pagesRouter = require('./routes/pages');
const pageSetsRouter = require('./routes/pageSets');
const scansRouter = require('./routes/scans');
const reportsRouter = require('./routes/reports');
const runsRouter = require('./routes/runs');

const app = express();

// CORS — allow any origin for public API
app.use(cors({ origin: true }));

// JSON body parsing
app.use(express.json());

// Health check (no auth required)
app.get('/v1/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1' });
});

// Global middleware pipeline
app.use(apiKeyAuth);
app.use(rateLimiter);
app.use(apiLogger);

// Mount routes under /v1.
// Since this app is exported as Cloud Function "api", final path becomes:
// /.../us-central1/api/v1/*
app.use('/v1/projects', projectsRouter);
// Pages, page-sets, scans, issues, and reports are nested under /projects/:id
app.use('/v1/projects', pagesRouter);
app.use('/v1/projects', pageSetsRouter);
app.use('/v1/projects', scansRouter);
app.use('/v1/projects', reportsRouter);
app.use('/v1/runs', runsRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
