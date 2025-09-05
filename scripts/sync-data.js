#!/usr/bin/env node

const { syncProblems } = require('./sync-problems');
const { syncBoulders } = require('./sync-boulders');
const { syncSubareas } = require('./sync-subareas');
const { isValidationRun } = require('./shared/sync-utils');

/**
 * Main data synchronization script
 * Syncs all data types: problems, boulders, circuits, and subareas
 */
function syncAllData() {
  const isValidation = isValidationRun();
  
  console.log(isValidation ? 
    '🔍 Validating all data files...' : 
    '🔄 Syncing all data files...'
  );
  
  let allSuccess = true;
  
  try {
    // Sync problems data
    const problemsSuccess = syncProblems();
    allSuccess = allSuccess && problemsSuccess;
    
    // Sync boulders data
    const bouldersSuccess = syncBoulders();
    allSuccess = allSuccess && bouldersSuccess;
    
    // Sync subareas data
    const subareasSuccess = syncSubareas();
    allSuccess = allSuccess && subareasSuccess;
    
    if (isValidation) {
      if (allSuccess) {
        console.log('✅ All data files are in sync');
        process.exit(0);
      } else {
        console.error('❌ Some data files are out of sync!');
        console.error('   Run: npm run sync-data');
        process.exit(1);
      }
    } else {
      if (allSuccess) {
        console.log('✅ All data files synchronized successfully');
        console.log('   App will use the latest data on next reload.');
      } else {
        console.error('❌ Some data files failed to sync');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during data synchronization:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncAllData();
}

module.exports = { syncAllData };