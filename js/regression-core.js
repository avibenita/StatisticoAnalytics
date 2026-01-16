/**
 * Regression Core - Display regression results
 * Loads results from sessionStorage (populated by input.html)
 */

function formatNumber(value, decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) {
    return '---';
  }
  if (Math.abs(value) < 0.0001 && value !== 0) {
    return value.toExponential(2);
  }
  return value.toFixed(decimals);
}

function formatPValue(pValue) {
  if (pValue === null || pValue === undefined || isNaN(pValue)) {
    return '---';
  }
  if (pValue < 0.001) {
    return '< 0.001';
  }
  return pValue.toFixed(4);
}

function getSignificanceStars(pValue) {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  if (pValue < 0.1) return '.';
  return '';
}

/**
 * Load and display regression results
 */
function loadRegressionResults() {
  console.log('📊 Loading regression results from sessionStorage...');
  
  // Try to load results from sessionStorage
  const resultsJson = sessionStorage.getItem('regressionResults');
  
  if (!resultsJson) {
    console.warn('⚠️ No regression results found in sessionStorage');
    displayNoResultsMessage();
    return false;
  }
  
  try {
    const results = JSON.parse(resultsJson);
    console.log('✅ Results loaded:', results);
    
    // Display all results
    displayModelInfo(results);
    displayModelFit(results);
    displayFTest(results);
    displayCoefficientsTable(results);
    displayRegressionEquation(results);
    
    console.log('✅ Results displayed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error parsing results:', error);
    displayErrorMessage(error);
    return false;
  }
}

/**
 * Display model information
 */
function displayModelInfo(results) {
  document.getElementById('validObs').textContent = results.n || '---';
  document.getElementById('includeIntercept').textContent = results.includeIntercept ? 'Yes' : 'No';
  
  // Count numeric vs categorical variables
  const numNumeric = results.xVarNames ? results.xVarNames.filter(v => !v.includes('(Cat)')).length : 0;
  const numCategorical = results.xVarNames ? results.xVarNames.filter(v => v.includes('(Cat)')).length : 0;
  
  document.getElementById('numNumericVars').textContent = numNumeric;
  document.getElementById('numCategoricalVars').textContent = numCategorical;
  document.getElementById('degreesOfFreedom').textContent = 
    `${results.dfRegression} (Model), ${results.dfResidual} (Residual)`;
}

/**
 * Display model fit statistics
 */
function displayModelFit(results) {
  document.getElementById('rSquared').textContent = formatNumber(results.rSquared, 4);
  document.getElementById('adjRSquared').textContent = formatNumber(results.adjRSquared, 4);
  document.getElementById('rootMSE').textContent = formatNumber(results.rmse, 4);
  document.getElementById('aic').textContent = formatNumber(results.aic, 2);
  document.getElementById('bic').textContent = formatNumber(results.bic, 2);
}

/**
 * Display F-test results
 */
function displayFTest(results) {
  document.getElementById('fStatistic').textContent = formatNumber(results.fStat, 2);
  document.getElementById('fPValue').textContent = formatPValue(results.fPValue);
  
  // Update F-test result text
  const significance = results.fPValue < 0.05 ? 'significant' : 'not significant';
  const resultText = `The overall model is <strong>${significance}</strong> ` +
                     `(F = ${formatNumber(results.fStat, 2)}, p ${results.fPValue < 0.001 ? '< 0.001' : '= ' + formatPValue(results.fPValue)})`;
  document.getElementById('fTestResult').innerHTML = resultText;
}

/**
 * Display coefficients table
 */
function displayCoefficientsTable(results) {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';
  
  for (let i = 0; i < results.coefficients.length; i++) {
    const tr = document.createElement('tr');
    
    // Variable name
    const tdVar = document.createElement('td');
    tdVar.textContent = results.allVarNames[i] || `Variable ${i}`;
    tr.appendChild(tdVar);
    
    // Coefficient
    const tdCoef = document.createElement('td');
    tdCoef.textContent = formatNumber(results.coefficients[i], 4);
    tr.appendChild(tdCoef);
    
    // Standard Error
    const tdSE = document.createElement('td');
    tdSE.textContent = formatNumber(results.standardErrors[i], 4);
    tr.appendChild(tdSE);
    
    // t-statistic
    const tdT = document.createElement('td');
    tdT.textContent = formatNumber(results.tStats[i], 3);
    tr.appendChild(tdT);
    
    // P-value
    const tdP = document.createElement('td');
    const pValue = results.pValues[i];
    tdP.textContent = formatPValue(pValue) + ' ' + getSignificanceStars(pValue);
    tr.appendChild(tdP);
    
    // 95% CI Lower
    const tdCILower = document.createElement('td');
    tdCILower.textContent = formatNumber(results.confIntLower[i], 4);
    tr.appendChild(tdCILower);
    
    // 95% CI Upper
    const tdCIUpper = document.createElement('td');
    tdCIUpper.textContent = formatNumber(results.confIntUpper[i], 4);
    tr.appendChild(tdCIUpper);
    
    // VIF
    const tdVIF = document.createElement('td');
    if (results.vif && results.vif[i] !== undefined && !isNaN(results.vif[i])) {
      tdVIF.textContent = formatNumber(results.vif[i], 2);
      // Highlight high VIF values
      if (results.vif[i] > 10) {
        tdVIF.style.color = '#ff6b6b';
        tdVIF.style.fontWeight = 'bold';
      } else if (results.vif[i] > 5) {
        tdVIF.style.color = '#ffd43b';
      }
    } else {
      tdVIF.textContent = '---';
    }
    tr.appendChild(tdVIF);
    
    tbody.appendChild(tr);
  }
}

/**
 * Display regression equation
 */
function displayRegressionEquation(results) {
  const yVar = results.yVarName || 'Y';
  const parts = [];
  
  for (let i = 0; i < results.coefficients.length; i++) {
    const coef = results.coefficients[i];
    const varName = results.allVarNames[i];
    
    if (varName === '(Intercept)') {
      parts.push(formatNumber(coef, 3));
    } else {
      const sign = coef >= 0 ? '+' : '';
      parts.push(`${sign} ${formatNumber(coef, 3)} × ${varName}`);
    }
  }
  
  const equation = `${yVar} = ${parts.join(' ')}`;
  document.getElementById('equationFormula').textContent = equation;
}

/**
 * Display message when no results are available
 */
function displayNoResultsMessage() {
  const message = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="fa-solid fa-info-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
      <h3>No Regression Results Available</h3>
      <p>Please run a regression analysis from the input panel first.</p>
      <p><a href="input.html" style="color: var(--accent-1);">Go to Input Panel</a></p>
    </div>
  `;
  
  document.querySelector('.card-body').innerHTML = message;
}

/**
 * Display error message
 */
function displayErrorMessage(error) {
  const message = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
      <h3>Error Loading Results</h3>
      <p>${error.message || 'Unknown error occurred'}</p>
      <p><a href="input.html" style="color: var(--accent-1);">Return to Input Panel</a></p>
    </div>
  `;
  
  document.querySelector('.card-body').innerHTML = message;
}

/**
 * Load sample data for demonstration (fallback)
 */
function loadSampleData() {
  console.log('📊 Attempting to load regression results...');
  
  // Try to load real results first
  const loaded = loadRegressionResults();
  
  if (!loaded) {
    console.log('⚠️ No results found - showing instructions');
    // Don't load sample data, show instructions instead
  }
}

// Initialize on page load
if (typeof window !== 'undefined') {
  window.loadRegressionResults = loadRegressionResults;
  window.loadSampleData = loadSampleData;
}
