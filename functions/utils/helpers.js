// functions/utils/helpers.js
const admin = require('firebase-admin');
const { SUBSCRIPTION_PACKAGES } = require('./package-config');

/**
 * Helper to produce a Firestore-friendly timestamp or fallback to JS Date
 */
function nowTimestamp() {
  try {
    if (admin && admin.firestore && admin.firestore.Timestamp && typeof admin.firestore.Timestamp.now === 'function') {
      return admin.firestore.Timestamp.now();
    }
  } catch (e) {
    // ignore and fallback to Date
  }
  return new Date();
}


function getTimestamp(){
  try {
    if (admin && admin.firestore && admin.firestore.Timestamp && typeof admin.firestore.Timestamp.now === 'function') {
      console.log('admin.firestore.Timestamp found');
      return admin.firestore.Timestamp;
    }
  } catch (e) {
    // ignore and fallback to Date
  }
  console.log('admin.firestore.Timestamp not found, falling back to Date'); 
  return new Date();
}

function getPackageConfig(packageName) {
  if (!packageName || typeof packageName !== 'string') return null;
  return SUBSCRIPTION_PACKAGES[packageName] || null;
}

/**
 * Parse ?limit and ?after cursor params from a query string.
 *
 * @param {object} queryParams - req.query
 * @param {number} defaultLimit - default page size
 * @param {number} maxLimit     - hard cap (prevents abuse)
 * @returns {{ pageSize: number, afterId: string|null }}
 */
function parsePaginationParams(queryParams, defaultLimit = 50, maxLimit = 500) {
  const pageSize = Math.min(
    Math.max(1, parseInt(queryParams.limit, 10) || defaultLimit),
    maxLimit
  );
  const afterId = queryParams.after || null;
  return { pageSize, afterId };
}

/**
 * Execute a paginated Firestore query using cursor-based pagination.
 *
 * Fetches pageSize+1 docs to determine whether a next page exists without
 * an extra count query.
 *
 * @param {FirebaseFirestore.Query}              baseQuery     - Already ordered, no .limit() applied
 * @param {number}                               pageSize      - Desired page size
 * @param {string|null}                          afterId       - Document ID to start after (exclusive)
 * @param {FirebaseFirestore.CollectionReference} collectionRef - Used to resolve the cursor document
 * @returns {Promise<{ docs: QueryDocumentSnapshot[], hasMore: boolean, nextCursor: string|null }>}
 */
async function paginate(baseQuery, pageSize, afterId, collectionRef) {
  let q = baseQuery.limit(pageSize + 1);

  if (afterId) {
    const afterSnap = await collectionRef.doc(afterId).get();
    if (afterSnap.exists) {
      q = q.startAfter(afterSnap);
    }
  }

  const snap = await q.get();
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  const nextCursor = hasMore ? docs[docs.length - 1].id : null;

  return { docs, hasMore, nextCursor };
}

module.exports = { nowTimestamp, getTimestamp, getPackageConfig, parsePaginationParams, paginate };
