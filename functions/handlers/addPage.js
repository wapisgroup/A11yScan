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
 * addPageHandler
 * --------------
 * Adds a single page to a project
 * 
 * @param {Object} data
 * @param {string} data.projectId - The project ID
 * @param {string} data.url - The page URL
 * @param {Object} context - Firebase callable context
 */
async function addPageHandler(data, context) {
  const { projectId, url } = data;

  // Validate required parameters
  if (!projectId) {
    throw new Error('Missing required parameter: projectId');
  }
  if (!url) {
    throw new Error('Missing required parameter: url');
  }

  // Validate authentication
  if (!context.auth) {
    throw new Error('Unauthenticated');
  }

  try {
    // Check if URL exists and returns 2xx
    let urlCheck = await checkUrlExists(url);
    let finalUrl = url;
    let httpStatus = urlCheck.statusCode;
    
    // If URL doesn't work, try with trailing slash
    if (!urlCheck.exists && !url.endsWith('/')) {
      const urlWithSlash = url + '/';
      const slashCheck = await checkUrlExists(urlWithSlash);
      if (slashCheck.exists) {
        urlCheck = slashCheck;
        finalUrl = urlWithSlash;
        httpStatus = slashCheck.statusCode;
      }
    }
    
    if (!urlCheck.exists) {
      throw new Error(`URL does not exist or is not accessible${httpStatus ? ` (HTTP ${httpStatus})` : ''}`);
    }

    // Ensure HTTP status code is 200
    if (httpStatus !== 200) {
      throw new Error(`URL must return HTTP 200, got HTTP ${httpStatus}`);
    }

    const db = admin.firestore();
    
    // Check if page already exists (check both with and without trailing slash)
    const pagesRef = db.collection('projects').doc(projectId).collection('pages');
    const existingPages = await pagesRef.where('url', '==', finalUrl).get();
    
    if (!existingPages.empty) {
      throw new Error('Page with this URL already exists');
    }

    // Add the page
    const pageDoc = {
      url: finalUrl,
      title: finalUrl, // Can be updated later when crawled
      createdAt: nowTimestamp(),
      status: 'manually added',
      httpStatus: httpStatus,
    };

    await pagesRef.add(pageDoc);

    return {
      success: true,
      message: 'Page added successfully',
    };
  } catch (error) {
    console.error('Error adding page:', error);
    throw new Error(error.message || 'Failed to add page');
  }
}

module.exports = { addPageHandler };
