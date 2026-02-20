#!/usr/bin/env node

const { initWriter } = require("../helpers/bigquery");

async function main() {
  const writer = await initWriter();
  if (!writer.enabled) {
    console.error("BigQuery query skipped:", writer.error || "disabled");
    process.exit(1);
    return;
  }

  const limit = Number(process.env.BQ_QUERY_LIMIT || 20);
  const projectId = writer.cfg.projectId;
  const dataset = writer.cfg.dataset;

  const query = `
    SELECT
      ingested_at,
      project_id,
      run_id,
      page_id,
      page_url,
      status,
      issues_total,
      critical,
      serious,
      moderate,
      minor
    FROM \`${projectId}.${dataset}.page_scans\`
    ORDER BY ingested_at DESC
    LIMIT @limit
  `;

  const [job] = await writer.bq.createQueryJob({
    query,
    location: writer.cfg.location || undefined,
    params: { limit },
  });
  const [rows] = await job.getQueryResults();

  console.log(`Latest page_scans rows (${rows.length})`);
  for (const row of rows) {
    console.log(
      JSON.stringify(
        {
          ingested_at: row.ingested_at && row.ingested_at.value ? row.ingested_at.value : row.ingested_at,
          project_id: row.project_id,
          run_id: row.run_id,
          page_id: row.page_id,
          status: row.status,
          issues_total: row.issues_total,
        },
        null,
        0
      )
    );
  }
}

main().catch((error) => {
  console.error("BigQuery query FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

