/**
 * Pure JavaScript Regression Calculator
 * Performs OLS (Ordinary Least Squares) regression
 * No dependencies - completely self-contained
 */

class RegressionCalculator {
  constructor() {
    console.log('📊 Regression Calculator initialized');
  }

  /**
   * Perform multiple linear regression
   * @param {Array} y - Dependent variable array
   * @param {Array<Array>} X - Independent variables matrix (each column is a variable)
   * @param {boolean} includeIntercept - Whether to include intercept term
   * @returns {Object} - Regression results
   */
  calculate(y, X, includeIntercept = true) {
    console.log('🔢 Starting regression calculation...');
    console.log(`   Y observations: ${y.length}`);
    console.log(`   X variables: ${X.length}`);
    console.log(`   Include intercept: ${includeIntercept}`);

    // Validate inputs
    if (!y || y.length === 0) {
      throw new Error('Y variable is empty');
    }
    if (!X || X.length === 0) {
      throw new Error('No X variables provided');
    }

    // Remove rows with missing values
    const cleanData = this.removeMissingValues(y, X);
    const yClean = cleanData.y;
    const XClean = cleanData.X;
    const n = yClean.length;
    const k = XClean.length; // Number of predictors

    console.log(`   After cleaning: ${n} observations, ${k} predictors`);

    if (n < k + 2) {
      throw new Error(`Insufficient observations (${n}) for ${k} predictors. Need at least ${k + 2}.`);
    }

    // Add intercept column if requested
    let XMatrix = XClean;
    if (includeIntercept) {
      XMatrix = [Array(n).fill(1), ...XClean]; // Add column of 1s at the beginning
    }

    // Calculate regression coefficients: β = (X'X)^(-1) X'y
    const coefficients = this.calculateCoefficients(XMatrix, yClean);
    
    // Calculate fitted values
    const yHat = this.predictValues(XMatrix, coefficients);
    
    // Calculate residuals
    const residuals = yClean.map((yi, i) => yi - yHat[i]);
    
    // Calculate Sum of Squares
    const yMean = this.mean(yClean);
    const SST = yClean.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0); // Total SS
    const SSR = yHat.reduce((sum, yhi) => sum + Math.pow(yhi - yMean, 2), 0); // Regression SS
    const SSE = residuals.reduce((sum, ri) => sum + Math.pow(ri, 2), 0); // Error SS
    
    // Degrees of freedom
    const dfTotal = n - 1;
    const dfRegression = includeIntercept ? k : k - 1;
    const dfResidual = n - (includeIntercept ? k + 1 : k);
    
    // Mean Squares
    const MSR = SSR / dfRegression;
    const MSE = SSE / dfResidual;
    const RMSE = Math.sqrt(MSE);
    
    // F-statistic
    const fStat = MSR / MSE;
    const fPValue = this.fDistributionPValue(fStat, dfRegression, dfResidual);
    
    // R-squared
    const rSquared = SSR / SST;
    const adjRSquared = 1 - ((1 - rSquared) * (n - 1) / dfResidual);
    
    // Standard errors and t-statistics
    const XTX = this.matrixMultiply(this.transpose(XMatrix), XMatrix);
    const XTXInv = this.invertMatrix(XTX);
    const varCovarMatrix = XTXInv.map(row => row.map(val => val * MSE));
    
    const standardErrors = varCovarMatrix.map((row, i) => Math.sqrt(row[i]));
    const tStats = coefficients.map((coef, i) => coef / standardErrors[i]);
    const pValues = tStats.map(t => this.tDistributionPValue(Math.abs(t), dfResidual) * 2);
    
    // Confidence intervals (95%)
    const tCritical = this.tCriticalValue(0.025, dfResidual);
    const confIntLower = coefficients.map((coef, i) => coef - tCritical * standardErrors[i]);
    const confIntUpper = coefficients.map((coef, i) => coef + tCritical * standardErrors[i]);
    
    // Calculate VIF (Variance Inflation Factor) for multicollinearity
    const vif = this.calculateVIF(XMatrix, includeIntercept);
    
    // AIC and BIC
    const numParams = includeIntercept ? k + 1 : k;
    const logLikelihood = -n / 2 * (Math.log(2 * Math.PI) + Math.log(SSE / n) + 1);
    const aic = -2 * logLikelihood + 2 * numParams;
    const bic = -2 * logLikelihood + Math.log(n) * numParams;
    
    console.log('✅ Regression calculation complete');
    console.log(`   R² = ${rSquared.toFixed(4)}, F = ${fStat.toFixed(2)}, p < ${fPValue.toFixed(4)}`);

    return {
      coefficients: coefficients,
      standardErrors: standardErrors,
      tStats: tStats,
      pValues: pValues,
      confIntLower: confIntLower,
      confIntUpper: confIntUpper,
      vif: vif,
      fittedValues: yHat,
      residuals: residuals,
      rSquared: rSquared,
      adjRSquared: adjRSquared,
      fStat: fStat,
      fPValue: fPValue,
      rmse: RMSE,
      aic: aic,
      bic: bic,
      n: n,
      k: k,
      dfRegression: dfRegression,
      dfResidual: dfResidual,
      SSR: SSR,
      SSE: SSE,
      SST: SST,
      MSR: MSR,
      MSE: MSE,
      includeIntercept: includeIntercept
    };
  }

  /**
   * Remove rows with missing values
   */
  removeMissingValues(y, X) {
    const validIndices = [];
    for (let i = 0; i < y.length; i++) {
      if (!this.isNaN(y[i]) && X.every(xCol => !this.isNaN(xCol[i]))) {
        validIndices.push(i);
      }
    }
    
    return {
      y: validIndices.map(i => y[i]),
      X: X.map(xCol => validIndices.map(i => xCol[i]))
    };
  }

  isNaN(value) {
    return value === null || value === undefined || value === '' || 
           (typeof value === 'number' && isNaN(value));
  }

  /**
   * Calculate regression coefficients using OLS
   */
  calculateCoefficients(X, y) {
    // β = (X'X)^(-1) X'y
    const XT = this.transpose(X);
    const XTX = this.matrixMultiply(XT, X);
    const XTXInv = this.invertMatrix(XTX);
    const XTy = this.vectorMatrixMultiply(XT, y);
    const beta = this.vectorMatrixMultiply(XTXInv, XTy);
    return beta;
  }

  /**
   * Predict values using coefficients
   */
  predictValues(X, coefficients) {
    const n = X[0].length;
    const predictions = [];
    for (let i = 0; i < n; i++) {
      let pred = 0;
      for (let j = 0; j < X.length; j++) {
        pred += X[j][i] * coefficients[j];
      }
      predictions.push(pred);
    }
    return predictions;
  }

  /**
   * Matrix transpose
   */
  transpose(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];
    for (let j = 0; j < cols; j++) {
      const row = [];
      for (let i = 0; i < rows; i++) {
        row.push(matrix[i][j]);
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Matrix multiplication
   */
  matrixMultiply(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    
    const result = [];
    for (let i = 0; i < rowsA; i++) {
      const row = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        row.push(sum);
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Vector-matrix multiplication
   */
  vectorMatrixMultiply(matrix, vector) {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  /**
   * Matrix inversion using Gauss-Jordan elimination
   */
  invertMatrix(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [
      ...row,
      ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    ]);

    // Forward elimination
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
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error('Matrix is singular or near-singular');
      }
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
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

    // Extract inverse
    return augmented.map(row => row.slice(n));
  }

  /**
   * Calculate VIF for each predictor
   */
  calculateVIF(X, includeIntercept) {
    const vif = [];
    const startIdx = includeIntercept ? 1 : 0; // Skip intercept if present
    
    for (let i = startIdx; i < X.length; i++) {
      try {
        // Regress Xi on all other X variables
        const y = X[i];
        const otherX = X.filter((_, idx) => idx !== i && (idx >= startIdx));
        
        if (otherX.length === 0) {
          vif.push(1.0); // Only one predictor
          continue;
        }
        
        const cleanData = this.removeMissingValues(y, otherX);
        const result = this.calculateCoefficients(otherX, cleanData.y);
        const predictions = this.predictValues(otherX, result);
        
        // Calculate R²
        const yMean = this.mean(cleanData.y);
        const SST = cleanData.y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const SSR = predictions.reduce((sum, yhi, idx) => 
          sum + Math.pow(yhi - yMean, 2), 0);
        const rSquared = SSR / SST;
        
        // VIF = 1 / (1 - R²)
        const vifValue = 1 / (1 - rSquared);
        vif.push(Math.max(1, vifValue)); // VIF should be at least 1
      } catch (e) {
        vif.push(NaN);
      }
    }
    
    return includeIntercept ? [NaN, ...vif] : vif; // Add placeholder for intercept
  }

  /**
   * Calculate mean
   */
  mean(array) {
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * F-distribution p-value (approximation)
   */
  fDistributionPValue(f, df1, df2) {
    if (f < 0) return 1;
    // Use incomplete beta function approximation
    const x = df2 / (df2 + df1 * f);
    return this.incompleteBeta(x, df2 / 2, df1 / 2);
  }

  /**
   * T-distribution p-value (approximation)
   */
  tDistributionPValue(t, df) {
    if (t < 0) t = -t;
    const x = df / (df + t * t);
    return this.incompleteBeta(x, df / 2, 0.5);
  }

  /**
   * T critical value for confidence intervals
   */
  tCriticalValue(alpha, df) {
    // Approximation for t-critical value (95% CI)
    if (df >= 120) return 1.96; // Normal approximation
    const tValues = {
      1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
      10: 2.228, 20: 2.086, 30: 2.042, 40: 2.021, 50: 2.009,
      60: 2.000, 80: 1.990, 100: 1.984, 120: 1.980
    };
    
    // Find closest df
    const keys = Object.keys(tValues).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < keys.length; i++) {
      if (df <= keys[i]) return tValues[keys[i]];
    }
    return 1.96;
  }

  /**
   * Incomplete beta function (approximation)
   */
  incompleteBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    
    // Simple approximation
    const term1 = Math.pow(x, a) * Math.pow(1 - x, b) / a;
    let sum = term1;
    let term = term1;
    
    for (let i = 0; i < 100; i++) {
      term *= (a + b + i) * x / (a + i + 1);
      sum += term / (a + i + 1);
      if (Math.abs(term) < 1e-10) break;
    }
    
    return sum;
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.RegressionCalculator = RegressionCalculator;
}
