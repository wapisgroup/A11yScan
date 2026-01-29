const admin = require('firebase-admin');
const { nowTimestamp } = require('../utils/helpers');
const https = require('https');
const http = require('http');

/**
 * checkUrlExists
 * --------------
 * Checks if a URL returns a 2xx status code
 * 
 * @param {string} url - The URL to check
 * @returns {Promise<{exists: boolean, statusCode: number|null}>} - Object with exists flag and status code
 */
async function checkUrlExists(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: 5000, // 5 second timeout
    };

    const req = protocol.request(url, options, (res) => {
      // Check if status code is 2xx
      resolve({
        exists: res.statusCode >= 200 && res.statusCode < 300,
        statusCode: res.statusCode
      });
    });

    req.on('error', () => {
      resolve({ exists: false, statusCode: null });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ exists: false, statusCode: null });
    });

    req.end();
  });
}

/**
 * uploadSitemapHandler
 * --------------------
 * Uploads multiple pages from a sitemap
 * 
 * @param {Object} data
 * @param {string} data.projectId - The project ID
 * @param {string[]} data.urls - Array of URLs from sitemap
 * @param {Object} context - Firebase callable context
 */
async function uploadSitemapHandler(data, context) {
  const { projectId, urls } = data;

  // Validate required parameters
  if (!projectId) {
    throw new Error('Missing required parameter: projectId');
  }
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    throw new Error('Missing or invalid parameter: urls');
  }

  // Validate authentication
  if (!context.auth) {
    throw new Error('Unauthenticated');
  }

  try {
    const db = admin.firestore();
    const pagesRef = db.collection('projects').doc(projectId).collection('pages');
    
    // Get existing pages to avoid duplicates
    const existingPagesSnap = await pagesRef.get();
    const existingUrls = new Set(existingPagesSnap.docs.map(doc => doc.data().url));
    
    // Filter out duplicates
    const newUrls = urls.filter(url => !existingUrls.has(url));
    
    if (newUrls.length === 0) {
      return {
        success: true,
        message: 'All pages already exist',
        added: 0,
        skipped: urls.length,
      };
    }

    // Check HTTP status for each URL
    console.log(`Checking HTTP status for ${newUrls.length} URLs...`);
    const urlChecks = await Promise.all(
      newUrls.map(async (url) => {
        // Try URL as-is
        let urlCheck = await checkUrlExists(url);
        let finalUrl = url;
        
        // If failed, try with trailing slash
        if (!urlCheck.exists && !url.endsWith('/')) {
          const urlWithSlash = url + '/';
          const slashCheck = await checkUrlExists(urlWithSlash);
          if (slashCheck.exists) {
            urlCheck = slashCheck;
            finalUrl = urlWithSlash;
          }
        }
        
        return {
          url: finalUrl,
          statusCode: urlCheck.statusCode,
          exists: urlCheck.exists
        };
      })
    );

    // Batch add pages (Firestore batch limit is 500)
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;
    let addedCount = 0;
    let failedCount = 0;

    for (const check of urlChecks) {
      if (!check.exists) {
        console.warn(`Skipping ${check.url}: not accessible (HTTP ${check.statusCode || 'N/A'})`);
        failedCount++;
        continue;
      }

      const pageRef = pagesRef.doc();
      const pageDoc = {
        url: check.url,
        title: check.url,
        createdAt: nowTimestamp(),
        status: 'added from sitemap',
        httpStatus: check.statusCode,
      };
      
      currentBatch.set(pageRef, pageDoc);
      operationCount++;
      addedCount++;

      // Firebase batch limit is 500 operations
      if (operationCount >= 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
    }

    // Add remaining batch if not empty
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map(batch => batch.commit()));

    const message = failedCount > 0 
      ? `${addedCount} pages added successfully, ${failedCount} pages skipped (not accessible)`
      : `${addedCount} pages added successfully`;

    return {
      success: true,
      message,
      added: addedCount,
      skipped: urls.length - addedCount,
      failed: failedCount,
    };
  } catch (error) {
    console.error('Error uploading sitemap:', error);
    throw new Error(error.message || 'Failed to upload sitemap');
  }
}

module.exports = { uploadSitemapHandler };
