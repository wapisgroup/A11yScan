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

module.exports = { nowTimestamp, getTimestamp, getPackageConfig };
