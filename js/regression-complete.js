/**
 * Complete Regression Analysis - Pure JavaScript
 * Replaces VB6 form output completely
 * 
 * This module computes:
 * - Regression coefficients
 * - Standard errors
 * - t-values and p-values
 * - R², Adjusted R², F-test
 * - ANOVA table
 * - Advanced diagnostics (VIF, Durbin-Watson, PRESS)
 */

// Initialize Office.js
Office.onReady((info) => {
    if (info.host === Office.HostType.Excel) {
        console.log('✅ Regression Complete module loaded');
        loadSavedRanges();
    }
});

// Global state
let regressionResults = null;
let regressionData = null;

// ============================================================================
// TAB SWITCHING
// ============================================================================

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to corresponding tab button
    event.target.classList.add('active');
}

// ============================================================================
// STATUS MESSAGES
// ============================================================================

function showStatus(elementId, message, type = 'info') {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

function hideStatus(elementId) {
    const statusEl = document.getElementById(elementId);
    if (statusEl) statusEl.style.display = 'none';
}

// ============================================================================
// MAIN REGRESSION COMPUTATION
// ============================================================================

async function runCompleteRegression() {
    const xRange = document.getElementById('xRange').value.trim();
    const yRange = document.getElementById('yRange').value.trim();
    const includeIntercept = document.getElementById('includeIntercept').checked;
    const alpha = parseFloat(document.getElementById('alphaLevel').value);

    // Validation
    if (!xRange || !yRange) {
        showStatus('setupStatus', 'Please enter both X and Y ranges', 'error');
        return;
    }

    const btn = document.getElementById('runRegressionBtn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Computing...';

    try {
        // Step 1: Read data from Excel
        showStatus('setupStatus', '📊 Reading data from Excel...', 'info');
        
        const data = await readRegressionData(xRange, yRange);
        regressionData = data;

        // Step 2: Compute regression locally (pure JavaScript)
        showStatus('setupStatus', '🔢 Computing regression...', 'info');
        
        const results = computeOLS(data.X, data.Y, includeIntercept, alpha);
        regressionResults = results;

        // Step 3: Display results in all tabs
        displayRegressionResults(results);

        // Step 4: Switch to results tab
        switchTab('results');
        document.querySelectorAll('.tab').forEach((tab, idx) => {
            if (idx === 1) tab.classList.add('active');
            else tab.classList.remove('active');
        });

        // Save ranges for next time
        saveRanges(xRange, yRange, includeIntercept, alpha);

        showStatus('setupStatus', '✅ Regression complete! Check Results tab.', 'success');

    } catch (error) {
        console.error('Error:', error);
        showStatus('setupStatus', `❌ Error: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// ============================================================================
// DATA READING FROM EXCEL
// ============================================================================

async function readRegressionData(xRangeAddress, yRangeAddress) {
    return await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        
        const xRange = sheet.getRange(xRangeAddress);
        const yRange = sheet.getRange(yRangeAddress);
        
        xRange.load('values');
        yRange.load('values');
        
        await context.sync();
        
        // Convert to numeric arrays
        const X = xRange.values.map(row => row.map(cell => parseFloat(cell)));
        const Y = yRange.values.map(row => parseFloat(row[0]));
        
        console.log(`📊 Data loaded: ${Y.length} observations, ${X[0].length} predictors`);
        
        return { X, Y };
    });
}

// ============================================================================
// OLS REGRESSION COMPUTATION (Pure JavaScript - No Python needed!)
// ============================================================================

function computeOLS(X, Y, includeIntercept, alpha) {
    const n = Y.length;
    const p = X[0].length;
    
    // Add intercept column if requested
    if (includeIntercept) {
        X = X.map(row => [1, ...row]);
    }
    
    const k = X[0].length; // Number of parameters (including intercept if any)
    
    // Compute X'X
    const XtX = matrixMultiply(transpose(X), X);
    
    // Compute (X'X)^-1
    const XtX_inv = matrixInverse(XtX);
    
    // Compute coefficients: β = (X'X)^-1 X'Y
    const Xt = transpose(X);
    const XtY = matrixMultiply(Xt, Y.map(y => [y]));
    const beta = matrixMultiply(XtX_inv, XtY).map(row => row[0]);
    
    // Compute fitted values and residuals
    const Y_fit = X.map(row => row.reduce((sum, xi, i) => sum + xi * beta[i], 0));
    const residuals = Y.map((yi, i) => yi - Y_fit[i]);
    
    // Compute sum of squares
    const Y_mean = Y.reduce((sum, y) => sum + y, 0) / n;
    const TSS = Y.reduce((sum, y) => sum + Math.pow(y - Y_mean, 2), 0);
    const SSR = residuals.reduce((sum, r) => sum + r * r, 0);
    const SSE = TSS - SSR;
    
    // R² and Adjusted R²
    const R2 = 1 - (SSR / TSS);
    const R2_adj = 1 - ((1 - R2) * (n - 1) / (n - k));
    
    // Standard error of regression
    const MSE = SSR / (n - k);
    const RMSE = Math.sqrt(MSE);
    
    // Standard errors of coefficients
    const SE = beta.map((_, i) => Math.sqrt(XtX_inv[i][i] * MSE));
    
    // t-values
    const t_values = beta.map((b, i) => b / SE[i]);
    
    // p-values (two-tailed t-test)
    const df = n - k;
    const p_values = t_values.map(t => 2 * (1 - tCDF(Math.abs(t), df)));
    
    // Confidence intervals
    const t_crit = tInverse(alpha / 2, df);
    const CI_lower = beta.map((b, i) => b - t_crit * SE[i]);
    const CI_upper = beta.map((b, i) => b + t_crit * SE[i]);
    
    // F-statistic
    const F_stat = (SSE / (k - 1)) / (SSR / (n - k));
    const F_pvalue = 1 - fCDF(F_stat, k - 1, n - k);
    
    // AIC and BIC
    const AIC = n * Math.log(SSR / n) + 2 * k;
    const BIC = n * Math.log(SSR / n) + k * Math.log(n);
    
    return {
        coefficients: beta,
        std_errors: SE,
        t_values: t_values,
        p_values: p_values,
        CI_lower: CI_lower,
        CI_upper: CI_upper,
        R2: R2,
        R2_adj: R2_adj,
        RMSE: RMSE,
        MSE: MSE,
        F_stat: F_stat,
        F_pvalue: F_pvalue,
        AIC: AIC,
        BIC: BIC,
        TSS: TSS,
        SSR: SSR,
        SSE: SSE,
        n: n,
        k: k,
        p: p,
        df: df,
        includeIntercept: includeIntercept,
        alpha: alpha,
        residuals: residuals,
        Y_fit: Y_fit
    };
}

// ============================================================================
// DISPLAY RESULTS IN UI
// ============================================================================

function displayRegressionResults(results) {
    // Model Fit Tab
    document.getElementById('nObs').textContent = results.n;
    document.getElementById('nPredictors').textContent = results.p;
    document.getElementById('rSquared').textContent = results.R2.toFixed(4);
    document.getElementById('adjRSquared').textContent = results.R2_adj.toFixed(4);
    document.getElementById('rootMSE').textContent = results.RMSE.toFixed(4);
    document.getElementById('fStat').textContent = results.F_stat.toFixed(4);
    document.getElementById('fPvalue').textContent = results.F_pvalue.toFixed(4);
    document.getElementById('aic').textContent = results.AIC.toFixed(2);
    document.getElementById('bic').textContent = results.BIC.toFixed(2);
    document.getElementById('df').textContent = results.df;
    
    // Coefficients Table
    displayCoefficientsTable(results);
    
    // ANOVA Table
    displayANOVATable(results);
    
    // Equation
    displayEquation(results);
    
    console.log('✅ Results displayed in all tabs');
}

function displayCoefficientsTable(results) {
    const tbody = document.getElementById('coefficientsBody');
    tbody.innerHTML = '';
    
    results.coefficients.forEach((coef, i) => {
        const row = document.createElement('tr');
        
        let varName;
        if (results.includeIntercept) {
            varName = i === 0 ? 'Intercept' : `X${i}`;
        } else {
            varName = `X${i + 1}`;
        }
        
        const significant = results.p_values[i] < results.alpha;
        const sigClass = significant ? 'significant' : 'not-significant';
        
        row.innerHTML = `
            <td><strong>${varName}</strong></td>
            <td>${coef.toFixed(4)}</td>
            <td>${results.std_errors[i].toFixed(4)}</td>
            <td>${results.t_values[i].toFixed(4)}</td>
            <td class="${sigClass}">${results.p_values[i].toFixed(4)}</td>
            <td>${results.CI_lower[i].toFixed(4)}</td>
            <td>${results.CI_upper[i].toFixed(4)}</td>
            <td class="${sigClass}">${significant ? '✓ Yes' : '✗ No'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function displayANOVATable(results) {
    const tbody = document.getElementById('anovaBody');
    tbody.innerHTML = '';
    
    // Model row
    const modelRow = document.createElement('tr');
    modelRow.innerHTML = `
        <td><strong>Model</strong></td>
        <td>${results.SSE.toFixed(2)}</td>
        <td>${results.k - 1}</td>
        <td>${(results.SSE / (results.k - 1)).toFixed(2)}</td>
        <td>${results.F_stat.toFixed(4)}</td>
        <td>${results.F_pvalue.toFixed(4)}</td>
    `;
    tbody.appendChild(modelRow);
    
    // Residual row
    const residualRow = document.createElement('tr');
    residualRow.innerHTML = `
        <td><strong>Residual</strong></td>
        <td>${results.SSR.toFixed(2)}</td>
        <td>${results.df}</td>
        <td>${results.MSE.toFixed(2)}</td>
        <td>-</td>
        <td>-</td>
    `;
    tbody.appendChild(residualRow);
    
    // Total row
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td>${results.TSS.toFixed(2)}</td>
        <td>${results.n - 1}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    `;
    tbody.appendChild(totalRow);
}

function displayEquation(results) {
    const container = document.getElementById('equationDisplay');
    
    let equation = '<span class="var">Y</span> = ';
    
    results.coefficients.forEach((coef, i) => {
        if (results.includeIntercept && i === 0) {
            equation += `<span class="coef">${coef.toFixed(4)}</span>`;
        } else {
            const sign = coef >= 0 ? '+' : '';
            const varName = results.includeIntercept ? `X${i}` : `X${i + 1}`;
            equation += ` ${sign} <span class="coef">${coef.toFixed(4)}</span> × <span class="var">${varName}</span>`;
        }
    });
    
    equation += ' + ε';
    
    container.innerHTML = equation;
}

// ============================================================================
// ADVANCED DIAGNOSTICS (Call Python cloud function)
// ============================================================================

async function computeAdvancedDiagnostics() {
    if (!regressionData) {
        showStatus('diagnosticsStatus', 'Run regression first', 'error');
        return;
    }

    try {
        const integration = new RegressionDiagnosticsIntegration();
        integration.setRegressionData(
            regressionData.X,
            regressionData.Y,
            regressionResults.includeIntercept
        );

        showStatus('diagnosticsStatus', '🔬 Computing advanced diagnostics...', 'info');
        
        await integration.computeDiagnostics();
        
        // Display diagnostics
        const diag = integration.diagnosticsResults;
        
        document.getElementById('conditionNumber').textContent = 
            diag.multicollinearity.condition_number === Infinity 
                ? '∞' 
                : diag.multicollinearity.condition_number.toFixed(2);
        
        document.getElementById('determinant').textContent = 
            diag.multicollinearity.determinant.toExponential(4);
        
        document.getElementById('durbinWatson').textContent = 
            diag.autocorrelation.durbin_watson.toFixed(4);
        
        document.getElementById('lag1Autocorr').textContent = 
            diag.autocorrelation.lag1_autocorr.toFixed(4);
        
        document.getElementById('pressStatistic').textContent = 
            diag.leverage.press.toFixed(4);
        
        // Display VIF
        displayVIFValues(diag.multicollinearity.vif);
        
        showStatus('diagnosticsStatus', '✅ Advanced diagnostics complete!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showStatus('diagnosticsStatus', `❌ Error: ${error.message}`, 'error');
    }
}

function displayVIFValues(vifs) {
    const container = document.getElementById('vifList');
    let html = '<table style="width: 100%; font-size: 11px;">';
    
    vifs.forEach((vif, i) => {
        const varName = i === 0 ? 'Intercept' : `X${i}`;
        let vifClass = 'vif-ok';
        let indicator = '✓ OK';
        
        if (vif > 10) {
            vifClass = 'vif-high';
            indicator = '⚠️ High';
        } else if (vif > 5) {
            vifClass = 'vif-moderate';
            indicator = '⚡ Moderate';
        }
        
        html += `
            <tr>
                <td style="padding: 4px 0;"><strong>${varName}</strong></td>
                <td style="padding: 4px 8px; text-align: right;">${vif.toFixed(2)}</td>
                <td class="${vifClass}" style="padding: 4px 0;">${indicator}</td>
            </tr>
        `;
    });
    
    html += '</table>';
    container.innerHTML = html;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

async function writeResultsToExcel() {
    if (!regressionResults) {
        alert('No results to write. Run regression first.');
        return;
    }

    try {
        await Excel.run(async (context) => {
            const sheet = context.workbook.worksheets.getActiveWorksheet();
            
            // Find empty column (start at column G)
            let startCol = 'G';
            const outputRange = sheet.getRange(`${startCol}1`);
            
            // Prepare output data
            const output = [
                ['REGRESSION RESULTS'],
                [''],
                ['Model Summary'],
                ['Observations', regressionResults.n],
                ['Predictors', regressionResults.p],
                ['R²', regressionResults.R2],
                ['Adjusted R²', regressionResults.R2_adj],
                ['Root MSE', regressionResults.RMSE],
                ['F-Statistic', regressionResults.F_stat],
                ['F P-value', regressionResults.F_pvalue],
                ['AIC', regressionResults.AIC],
                ['BIC', regressionResults.BIC],
                [''],
                ['Coefficients', 'Value', 'Std Error', 't-value', 'P-value']
            ];
            
            regressionResults.coefficients.forEach((coef, i) => {
                const varName = regressionResults.includeIntercept && i === 0 ? 'Intercept' : `X${i}`;
                output.push([
                    varName,
                    coef,
                    regressionResults.std_errors[i],
                    regressionResults.t_values[i],
                    regressionResults.p_values[i]
                ]);
            });
            
            const range = outputRange.getResizedRange(output.length - 1, output[0].length - 1);
            range.values = output;
            
            // Format headers
            const headerRange = outputRange.getResizedRange(0, output[0].length - 1);
            headerRange.format.font.bold = true;
            headerRange.format.font.size = 14;
            
            await context.sync();
            
            alert('✅ Results written to Excel!');
        });
    } catch (error) {
        alert(`Error writing to Excel: ${error.message}`);
    }
}

function copyEquationToClipboard() {
    if (!regressionResults) {
        alert('No equation to copy. Run regression first.');
        return;
    }

    let equation = 'Y = ';
    
    regressionResults.coefficients.forEach((coef, i) => {
        if (regressionResults.includeIntercept && i === 0) {
            equation += coef.toFixed(4);
        } else {
            const sign = coef >= 0 ? ' + ' : ' ';
            const varName = regressionResults.includeIntercept ? `X${i}` : `X${i + 1}`;
            equation += `${sign}${coef.toFixed(4)}*${varName}`;
        }
    });
    
    equation += ' + ε';
    
    navigator.clipboard.writeText(equation).then(() => {
        alert('✅ Equation copied to clipboard!');
    }).catch(err => {
        alert('Could not copy equation: ' + err.message);
    });
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

function saveRanges(xRange, yRange, intercept, alpha) {
    localStorage.setItem('regressionXRange', xRange);
    localStorage.setItem('regressionYRange', yRange);
    localStorage.setItem('regressionIntercept', intercept);
    localStorage.setItem('regressionAlpha', alpha);
}

function loadSavedRanges() {
    const xRange = localStorage.getItem('regressionXRange');
    const yRange = localStorage.getItem('regressionYRange');
    const intercept = localStorage.getItem('regressionIntercept');
    const alpha = localStorage.getItem('regressionAlpha');

    if (xRange) document.getElementById('xRange').value = xRange;
    if (yRange) document.getElementById('yRange').value = yRange;
    if (intercept !== null) {
        document.getElementById('includeIntercept').checked = (intercept === 'true');
    }
    if (alpha) document.getElementById('alphaLevel').value = alpha;
}

// ============================================================================
// MATRIX OPERATIONS (Linear Algebra)
// ============================================================================

function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function matrixMultiply(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < A[0].length; k++) {
                sum += A[i][k] * B[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function matrixInverse(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [
        ...row,
        ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    ]);
    
    // Gauss-Jordan elimination
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        
        // Make diagonal 1
        const divisor = augmented[i][i];
        for (let j = 0; j < 2 * n; j++) {
            augmented[i][j] /= divisor;
        }
        
        // Eliminate column
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = 0; j < 2 * n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
    }
    
    return augmented.map(row => row.slice(n));
}

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

function tCDF(t, df) {
    // Approximation of Student's t CDF
    const x = df / (df + t * t);
    return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x);
}

function tInverse(p, df) {
    // Approximation of t critical value
    return Math.sqrt(df * (Math.pow(1 - 2 * p, -2 / df) - 1));
}

function fCDF(f, df1, df2) {
    // Approximation of F CDF
    const x = df2 / (df2 + df1 * f);
    return 1 - incompleteBeta(df2 / 2, df1 / 2, x);
}

function incompleteBeta(a, b, x) {
    // Simple approximation
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return Math.pow(x, a) * Math.pow(1 - x, b) / (a + b);
}

console.log('✅ Regression Complete module loaded');
