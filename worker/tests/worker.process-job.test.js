const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const workerPath = path.resolve(__dirname, '../worker.js');
const apiClientPath = path.resolve(__dirname, '../helpers/api-client.js');
const pageCollectionPath = path.resolve(__dirname, '../handlers/pageCollection.js');
const scanPagesPath = path.resolve(__dirname, '../handlers/scanPages.js');
const pagesToSitemapPath = path.resolve(__dirname, '../handlers/pagesToSitemap.js');
const generateReportPath = path.resolve(__dirname, '../handlers/generateReport.js');

function withWorkerStubs(stubs, fn) {
  const snapshot = new Map();
  for (const modPath of [
    workerPath,
    apiClientPath,
    pageCollectionPath,
    scanPagesPath,
    pagesToSitemapPath,
    generateReportPath,
  ]) {
    snapshot.set(modPath, require.cache[modPath]);
    delete require.cache[modPath];
  }

  require.cache[apiClientPath] = {
    id: apiClientPath,
    filename: apiClientPath,
    loaded: true,
    exports: stubs.apiClient,
  };
  require.cache[pageCollectionPath] = {
    id: pageCollectionPath,
    filename: pageCollectionPath,
    loaded: true,
    exports: { handlePageCollectionJob: stubs.handlePageCollectionJob },
  };
  require.cache[scanPagesPath] = {
    id: scanPagesPath,
    filename: scanPagesPath,
    loaded: true,
    exports: { handleScanPages: stubs.handleScanPages },
  };
  require.cache[pagesToSitemapPath] = {
    id: pagesToSitemapPath,
    filename: pagesToSitemapPath,
    loaded: true,
    exports: { handlePagesToSitemapJob: stubs.handlePagesToSitemapJob },
  };
  require.cache[generateReportPath] = {
    id: generateReportPath,
    filename: generateReportPath,
    loaded: true,
    exports: { handleGenerateReport: stubs.handleGenerateReport },
  };

  const worker = require(workerPath);

  return Promise.resolve()
    .then(() => fn(worker))
    .finally(() => {
      for (const [modPath, entry] of snapshot.entries()) {
        delete require.cache[modPath];
        if (entry) require.cache[modPath] = entry;
      }
    });
}

test('processJob fails job when runId is missing for run-dependent action', async () => {
  const updateCalls = [];
  await withWorkerStubs(
    {
      apiClient: {
        getJobs: async () => [],
        getRun: async () => ({}),
        updateJob: async (id, data) => updateCalls.push({ id, data }),
      },
      handlePageCollectionJob: async () => {},
      handleScanPages: async () => {},
      handlePagesToSitemapJob: async () => {},
      handleGenerateReport: async () => {},
    },
    async ({ processJob }) => {
      await processJob({ id: 'job_1', action: 'scan_pages', projectId: 'p1', runId: null });
    }
  );

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].data.status, 'failed');
  assert.match(updateCalls[0].data.error, /Missing runId/);
});

test('processJob marks failed when run lookup returns 404', async () => {
  const updateCalls = [];
  await withWorkerStubs(
    {
      apiClient: {
        getJobs: async () => [],
        getRun: async () => {
          throw new Error('HTTP 404');
        },
        updateJob: async (id, data) => updateCalls.push({ id, data }),
      },
      handlePageCollectionJob: async () => {},
      handleScanPages: async () => {},
      handlePagesToSitemapJob: async () => {},
      handleGenerateReport: async () => {},
    },
    async ({ processJob }) => {
      await processJob({ id: 'job_2', action: 'page_collection', projectId: 'p1', runId: 'run_missing' });
    }
  );

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].data.status, 'failed');
  assert.match(updateCalls[0].data.error, /Run not found/);
});

test('processJob marks processing then completed on success path', async () => {
  const updateCalls = [];
  const handlerCalls = [];
  await withWorkerStubs(
    {
      apiClient: {
        getJobs: async () => [],
        getRun: async () => ({ id: 'run_1' }),
        updateJob: async (id, data) => updateCalls.push({ id, data }),
      },
      handlePageCollectionJob: async (projectId, runId) => {
        handlerCalls.push({ projectId, runId });
      },
      handleScanPages: async () => {},
      handlePagesToSitemapJob: async () => {},
      handleGenerateReport: async () => {},
    },
    async ({ processJob }) => {
      await processJob({ id: 'job_3', action: 'page_collection', projectId: 'p1', runId: 'run_1' });
    }
  );

  assert.equal(handlerCalls.length, 1);
  assert.deepEqual(handlerCalls[0], { projectId: 'p1', runId: 'run_1' });
  assert.equal(updateCalls[0].data.status, 'processing');
  assert.equal(updateCalls[1].data.status, 'completed');
});

test('processJob marks failed when handler throws', async () => {
  const updateCalls = [];
  await withWorkerStubs(
    {
      apiClient: {
        getJobs: async () => [],
        getRun: async () => ({ id: 'run_1' }),
        updateJob: async (id, data) => updateCalls.push({ id, data }),
      },
      handlePageCollectionJob: async () => {
        throw new Error('boom');
      },
      handleScanPages: async () => {},
      handlePagesToSitemapJob: async () => {},
      handleGenerateReport: async () => {},
    },
    async ({ processJob }) => {
      await processJob({ id: 'job_4', action: 'page_collection', projectId: 'p1', runId: 'run_1' });
    }
  );

  assert.equal(updateCalls[0].data.status, 'processing');
  assert.equal(updateCalls[1].data.status, 'failed');
  assert.match(updateCalls[1].data.error, /boom/);
});
