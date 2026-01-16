/**
 * Office.js Regression Diagnostics Integration
 * Pure JavaScript implementation - no VB6 needed!
 * 
 * This module:
 * 1. Reads regression data from Excel using Office.js
 * 2. Calls Python cloud function for diagnostics
 * 3. Displays results in task pane
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Set your deployed cloud function URL here
  cloudFunctionUrl: 'YOUR_CLOUD_FUNCTION_URL_HERE',
  // Example: 'https://us-central1-your-project.cloudfunctions.net/regression_diagnostics'
  // For local testing: 'http://localhost:8080'
  
  // Thresholds for diagnostics
  thresholds: {
    highCorr: 0.9,
    perfectCorr: 0.9999,
    vifHigh: 10,
    vifModerate: 5
  }
};

// ============================================================================
// MAIN INTEGRATION CLASS
// ============================================================================

class RegressionDiagnosticsIntegration {
  constructor() {
    this.regressionData = null;
    this.diagnosticsResults = null;
  }

  /**
   * Read regression data from Excel ranges
   * @param {string} xRangeAddress - Address of X data (e.g., "A2:C21")
   * @param {string} yRangeAddress - Address of Y data (e.g., "D2:D21")
   * @param {boolean} includeIntercept - Whether to include intercept
   * @returns {Promise<Object>} Regression data object
   */
  async readDataFromExcel(xRangeAddress, yRangeAddress, includeIntercept = true) {
    console.log('📊 Reading data from Excel...');
    
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      
      // Get X data range
      const xRange = sheet.getRange(xRangeAddress);
      const yRange = sheet.getRange(yRangeAddress);
      
      xRange.load('values');
      yRange.load('values');
      
      await context.sync();
      
      // Convert to arrays
      const xMatrix = xRange.values.map(row => 
        row.map(cell => parseFloat(cell))
      );
      
      const yVector = yRange.values.map(row => 
        parseFloat(row[0])
      );
      
      console.log(`✅ Read ${yVector.length} observations, ${xMatrix[0].length} predictors`);
      
      // Store data
      this.regressionData = {
        x: xMatrix,
        y: yVector,
        intercept: includeIntercept,
        thresholds: {
          high_corr: CONFIG.thresholds.highCorr,
          perfect_corr: CONFIG.thresholds.perfectCorr
        }
      };
      
      return this.regressionData;
    });
  }

  /**
   * Read data from named ranges (more robust approach)
   * @param {string} xRangeName - Name of X data range (e.g., "XData")
   * @param {string} yRangeName - Name of Y data range (e.g., "YData")
   * @param {boolean} includeIntercept - Whether to include intercept
   */
  async readDataFromNamedRanges(xRangeName, yRangeName, includeIntercept = true) {
    console.log('📊 Reading data from named ranges...');
    
    return await Excel.run(async (context) => {
      const xRange = context.workbook.names.getItem(xRangeName).getRange();
      const yRange = context.workbook.names.getItem(yRangeName).getRange();
      
      xRange.load('values');
      yRange.load('values');
      
      await context.sync();
      
      const xMatrix = xRange.values.map(row => 
        row.map(cell => parseFloat(cell))
      );
      
      const yVector = yRange.values.map(row => 
        parseFloat(row[0])
      );
      
      console.log(`✅ Read ${yVector.length} observations, ${xMatrix[0].length} predictors`);
      
      this.regressionData = {
        x: xMatrix,
        y: yVector,
        intercept: includeIntercept,
        thresholds: {
          high_corr: CONFIG.thresholds.highCorr,
          perfect_corr: CONFIG.thresholds.perfectCorr
        }
      };
      
      return this.regressionData;
    });
  }

  /**
   * Set regression data manually (if computed elsewhere)
   */
  setRegressionData(xMatrix, yVector, includeIntercept = true) {
    console.log('📦 Setting regression data manually...');
    
    this.regressionData = {
      x: xMatrix,
      y: yVector,
      intercept: includeIntercept,
      thresholds: {
        high_corr: CONFIG.thresholds.highCorr,
        perfect_corr: CONFIG.thresholds.perfectCorr
      }
    };
    
    console.log(`✅ Set ${yVector.length} observations, ${xMatrix[0].length} predictors`);
  }

  /**
   * Call Python cloud function to compute diagnostics
   * @returns {Promise<Object>} Diagnostics results
   */
  async computeDiagnostics() {
    if (!this.regressionData) {
      throw new Error('No regression data available. Call readDataFromExcel() first.');
    }

    if (!CONFIG.cloudFunctionUrl || CONFIG.cloudFunctionUrl === 'YOUR_CLOUD_FUNCTION_URL_HERE') {
      throw new Error('Cloud function URL not configured. Update CONFIG.cloudFunctionUrl in regression-integration.js');
    }

    console.log('🔬 Calling Python cloud function...');
    console.log('URL:', CONFIG.cloudFunctionUrl);
    
    try {
      const response = await fetch(CONFIG.cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.regressionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Unknown error from cloud function');
      }

      this.diagnosticsResults = result.diagnostics;
      console.log('✅ Diagnostics computed successfully');
      
      return this.diagnosticsResults;
      
    } catch (error) {
      console.error('❌ Error calling cloud function:', error);
      throw new Error(`Failed to compute diagnostics: ${error.message}`);
    }
  }

  /**
   * Display diagnostics results in HTML elements
   * @param {string} containerId - ID of container element
   */
  displayDiagnostics(containerId = 'diagnosticsPanel') {
    if (!this.diagnosticsResults) {
      console.warn('No diagnostics results to display');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    container.style.display = 'block';
    
    const diag = this.diagnosticsResults;
    
    // Multicollinearity
    this.updateElement('conditionNumber', 
      diag.multicollinearity.condition_number === Infinity 
        ? '∞' 
        : diag.multicollinearity.condition_number.toFixed(2)
    );
    
    this.updateElement('determinant', 
      diag.multicollinearity.determinant.toExponential(4)
    );
    
    // VIF values
    this.displayVIF(diag.multicollinearity.vif);
    
    // High correlations
    this.displayHighCorrelations(diag.multicollinearity.high_correlations);
    
    // Autocorrelation
    this.updateElement('durbinWatson', 
      diag.autocorrelation.durbin_watson.toFixed(4)
    );
    
    this.updateElement('lag1Autocorr', 
      diag.autocorrelation.lag1_autocorr.toFixed(4)
    );
    
    // PRESS
    this.updateElement('pressStatistic', 
      diag.leverage.press.toFixed(4)
    );
    
    console.log('✅ Diagnostics displayed in HTML');
  }

  /**
   * Display VIF values
   */
  displayVIF(vifs) {
    const vifList = document.getElementById('vifList');
    if (!vifList) return;
    
    let html = '<ul style="margin: 5px 0; padding-left: 20px;">';
    
    vifs.forEach((vif, idx) => {
      const varName = idx === 0 ? 'Intercept' : `X${idx}`;
      const color = vif > CONFIG.thresholds.vifHigh 
        ? 'color: #ff6b6b;' 
        : vif > CONFIG.thresholds.vifModerate 
          ? 'color: #ffa500;' 
          : '';
      
      const warning = vif > CONFIG.thresholds.vifHigh 
        ? ' ⚠️ High' 
        : vif > CONFIG.thresholds.vifModerate 
          ? ' ⚡ Moderate' 
          : '';
      
      html += `<li style="${color}">${varName}: ${vif.toFixed(2)}${warning}</li>`;
    });
    
    html += '</ul>';
    vifList.innerHTML = html;
  }

  /**
   * Display high correlations
   */
  displayHighCorrelations(correlations) {
    const container = document.getElementById('highCorrContainer');
    const list = document.getElementById('highCorrList');
    
    if (!container || !list) return;
    
    if (correlations && correlations.length > 0) {
      container.style.display = 'block';
      
      let html = '<ul style="margin: 5px 0; padding-left: 20px;">';
      correlations.forEach(pair => {
        const var1 = pair.i === 0 ? 'Intercept' : `X${pair.i}`;
        const var2 = pair.j === 0 ? 'Intercept' : `X${pair.j}`;
        const perfect = pair.perfect ? ' (Perfect!)' : '';
        html += `<li>${var1} ↔ ${var2}: r = ${pair.r.toFixed(4)}${perfect}</li>`;
      });
      html += '</ul>';
      
      list.innerHTML = html;
    } else {
      container.style.display = 'none';
    }
  }

  /**
   * Helper to update element text
   */
  updateElement(id, value) {
    const elem = document.getElementById(id);
    if (elem) elem.innerText = value;
  }

  /**
   * Write diagnostics results back to Excel
   * @param {string} startCell - Starting cell for output (e.g., "F2")
   */
  async writeDiagnosticsToExcel(startCell = 'F2') {
    if (!this.diagnosticsResults) {
      throw new Error('No diagnostics results available');
    }

    console.log('📝 Writing diagnostics to Excel...');
    
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const startRange = sheet.getRange(startCell);
      
      const diag = this.diagnosticsResults;
      
      // Prepare output data
      const output = [
        ['REGRESSION DIAGNOSTICS', ''],
        ['', ''],
        ['Multicollinearity', ''],
        ['Condition Number', diag.multicollinearity.condition_number],
        ['Determinant', diag.multicollinearity.determinant],
        ['', ''],
        ['VIF Values', ''],
      ];
      
      // Add VIF values
      diag.multicollinearity.vif.forEach((vif, idx) => {
        const varName = idx === 0 ? 'Intercept' : `X${idx}`;
        output.push([varName, vif]);
      });
      
      output.push(['', '']);
      output.push(['Autocorrelation', '']);
      output.push(['Durbin-Watson', diag.autocorrelation.durbin_watson]);
      output.push(['Lag-1 Autocorr', diag.autocorrelation.lag1_autocorr]);
      output.push(['', '']);
      output.push(['Prediction', '']);
      output.push(['PRESS', diag.leverage.press]);
      
      // Write to Excel
      const outputRange = startRange.getResizedRange(output.length - 1, 1);
      outputRange.values = output;
      
      // Format headers
      const headerRange = startRange.getResizedRange(0, 1);
      headerRange.format.font.bold = true;
      headerRange.format.font.size = 12;
      
      await context.sync();
      
      console.log('✅ Diagnostics written to Excel');
    });
  }

  /**
   * Get diagnostics summary as text
   */
  getSummaryText() {
    if (!this.diagnosticsResults) {
      return 'No diagnostics results available';
    }

    const diag = this.diagnosticsResults;
    let summary = '=== REGRESSION DIAGNOSTICS SUMMARY ===\n\n';
    
    summary += 'MULTICOLLINEARITY:\n';
    summary += `  Condition Number: ${diag.multicollinearity.condition_number.toFixed(2)}\n`;
    summary += `  Determinant: ${diag.multicollinearity.determinant.toExponential(4)}\n`;
    summary += '  VIF Values:\n';
    
    diag.multicollinearity.vif.forEach((vif, idx) => {
      const varName = idx === 0 ? 'Intercept' : `X${idx}`;
      summary += `    ${varName}: ${vif.toFixed(2)}\n`;
    });
    
    summary += '\nAUTOCORRELATION:\n';
    summary += `  Durbin-Watson: ${diag.autocorrelation.durbin_watson.toFixed(4)}\n`;
    summary += `  Lag-1 Autocorr: ${diag.autocorrelation.lag1_autocorr.toFixed(4)}\n`;
    
    summary += '\nPREDICTION:\n';
    summary += `  PRESS: ${diag.leverage.press.toFixed(4)}\n`;
    
    return summary;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR QUICK INTEGRATION
// ============================================================================

/**
 * Quick function: Read data from Excel and compute diagnostics
 * @param {string} xRangeAddress - X data range (e.g., "A2:C21")
 * @param {string} yRangeAddress - Y data range (e.g., "D2:D21")
 * @param {boolean} includeIntercept - Include intercept
 * @returns {Promise<Object>} Diagnostics results
 */
async function computeRegressionDiagnostics(xRangeAddress, yRangeAddress, includeIntercept = true) {
  const integration = new RegressionDiagnosticsIntegration();
  
  await integration.readDataFromExcel(xRangeAddress, yRangeAddress, includeIntercept);
  const results = await integration.computeDiagnostics();
  integration.displayDiagnostics();
  
  return results;
}

/**
 * Quick function: Compute and write to Excel
 */
async function computeAndWriteToExcel(xRange, yRange, outputCell, includeIntercept = true) {
  const integration = new RegressionDiagnosticsIntegration();
  
  await integration.readDataFromExcel(xRange, yRange, includeIntercept);
  await integration.computeDiagnostics();
  await integration.writeDiagnosticsToExcel(outputCell);
  
  return integration.diagnosticsResults;
}

// ============================================================================
// EXPORT FOR MODULE USAGE
// ============================================================================

// If using as ES6 module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RegressionDiagnosticsIntegration,
    computeRegressionDiagnostics,
    computeAndWriteToExcel,
    CONFIG
  };
}

// Make available globally for Office.js
if (typeof window !== 'undefined') {
  window.RegressionDiagnosticsIntegration = RegressionDiagnosticsIntegration;
  window.computeRegressionDiagnostics = computeRegressionDiagnostics;
  window.computeAndWriteToExcel = computeAndWriteToExcel;
  window.REGRESSION_CONFIG = CONFIG;
}

console.log('✅ Regression Diagnostics Integration module loaded');
