#!/usr/bin/env node
/* eslint-disable no-console */

const { testConnection } = require("../helpers/bigquery");

async function main() {
  const result = await testConnection();
  if (result.ok) {
    console.log("BigQuery connection OK");
    console.log(`- project: ${result.cfg.projectId}`);
    console.log(`- dataset: ${result.cfg.dataset}`);
    console.log(`- location: ${result.location || "(unknown)"}`);
    process.exit(0);
  }

  console.error("BigQuery connection FAILED");
  console.error(`- stage: ${result.stage}`);
  if (result.configErrors) {
    for (const e of result.configErrors) {
      console.error(`  • ${e}`);
    }
  }
  if (result.error) console.error(`- error: ${result.error}`);
  console.error("- cfg:", result.cfg);
  process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

