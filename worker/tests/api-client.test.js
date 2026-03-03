const test = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = '../helpers/api-client';

function loadClientWithEnv(env = {}) {
  const previous = {
    DASHBOARD_API_URL: process.env.DASHBOARD_API_URL,
    WORKER_API_TOKEN: process.env.WORKER_API_TOKEN,
    DASHBOARD_API_TOKEN: process.env.DASHBOARD_API_TOKEN,
    API_TOKEN: process.env.API_TOKEN,
  };

  Object.assign(process.env, {
    DASHBOARD_API_URL: '',
    WORKER_API_TOKEN: '',
    DASHBOARD_API_TOKEN: '',
    API_TOKEN: '',
    ...env,
  });

  delete require.cache[require.resolve(MODULE_PATH)];
  const mod = require(MODULE_PATH);

  return {
    mod,
    restore() {
      Object.assign(process.env, previous);
      delete require.cache[require.resolve(MODULE_PATH)];
    },
  };
}

test('getJobs sends bearer token and query params', async () => {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      json: async () => [{ id: 'job_1' }],
    };
  };

  const { mod, restore } = loadClientWithEnv({
    DASHBOARD_API_URL: 'http://localhost:3000',
    WORKER_API_TOKEN: 'token_123',
  });

  try {
    const result = await mod.getJobs('queued', 7);
    assert.equal(result.length, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://localhost:3000/api/v2/jobs?status=queued&limit=7');
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer token_123');
  } finally {
    restore();
    delete global.fetch;
  }
});

test('updateRun sends PATCH body as JSON', async () => {
  let captured;
  global.fetch = async (url, init) => {
    captured = { url, init };
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'run_1', status: 'running' }),
    };
  };

  const { mod, restore } = loadClientWithEnv({
    DASHBOARD_API_URL: 'http://localhost:3000',
    WORKER_API_TOKEN: 'token_abc',
  });

  try {
    const payload = { status: 'running', pagesScanned: 2 };
    await mod.updateRun('run_1', payload);
    assert.equal(captured.url, 'http://localhost:3000/api/v2/runs/run_1');
    assert.equal(captured.init.method, 'PATCH');
    assert.equal(captured.init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(captured.init.body), payload);
  } finally {
    restore();
    delete global.fetch;
  }
});

test('client throws descriptive error for non-ok response', async () => {
  global.fetch = async () => ({
    ok: false,
    status: 404,
    text: async () => '{"error":"Run not found"}',
  });

  const { mod, restore } = loadClientWithEnv({
    DASHBOARD_API_URL: 'http://localhost:3000',
    WORKER_API_TOKEN: 'token_abc',
  });

  try {
    await assert.rejects(
      () => mod.updateRun('run_missing', { status: 'failed' }),
      (err) => {
        assert.match(String(err.message), /PATCH \/api\/v2\/runs\/run_missing/);
        assert.match(String(err.message), /HTTP 404/);
        return true;
      }
    );
  } finally {
    restore();
    delete global.fetch;
  }
});

test('client throws when no worker token is configured', async () => {
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const { mod, restore } = loadClientWithEnv({
    DASHBOARD_API_URL: 'http://localhost:3000',
    WORKER_API_TOKEN: '',
    DASHBOARD_API_TOKEN: '',
    API_TOKEN: '',
  });

  try {
    await assert.rejects(
      () => mod.getJobs('queued', 1),
      /Missing worker API token/
    );
  } finally {
    restore();
    delete global.fetch;
  }
});
