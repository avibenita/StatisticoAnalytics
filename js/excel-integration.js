/**
 * Excel Integration Module
 * Pure JavaScript - reads data from Excel using Office.js
 * No VB6 dependencies
 */

class ExcelIntegration {
  constructor() {
    console.log('📊 Excel Integration initialized');
  }

  /**
   * Read data from Excel range
   * @param {string} rangeAddress - Excel range address (e.g., "A1:A100")
   * @returns {Promise<Array>} - Array of values
   */
  async readRange(rangeAddress) {
    return new Promise((resolve, reject) => {
      Excel.run(async (context) => {
        try {
          const sheet = context.workbook.worksheets.getActiveWorksheet();
          const range = sheet.getRange(rangeAddress);
          range.load('values');
          await context.sync();
          
          // Flatten 2D array to 1D array
          const values = range.values.flat();
          
          // Convert strings to numbers where applicable
          const cleanValues = values.map(val => {
            if (val === null || val === undefined || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? val : num;
          });
          
          resolve(cleanValues);
        } catch (error) {
          console.error('Error reading range:', rangeAddress, error);
          reject(error);
        }
      });
    });
  }

  /**
   * Read multiple ranges at once
   * @param {Object} ranges - Object with variable names as keys and range addresses as values
   * @returns {Promise<Object>} - Object with variable names as keys and data arrays as values
   */
  async readMultipleRanges(ranges) {
    const data = {};
    const varNames = Object.keys(ranges);
    
    console.log(`📥 Reading ${varNames.length} ranges from Excel...`);
    
    for (const varName of varNames) {
      try {
        data[varName] = await this.readRange(ranges[varName]);
        console.log(`   ✅ ${varName}: ${data[varName].length} values`);
      } catch (error) {
        console.error(`   ❌ ${varName}: Failed to read`);
        throw new Error(`Failed to read ${varName} from ${ranges[varName]}`);
      }
    }
    
    return data;
  }

  /**
   * Run regression analysis
   * @param {Object} modelSpec - Model specification with y, xn, xc, intercept, and ranges
   * @returns {Promise<Object>} - Regression results
   */
  async runRegression(modelSpec) {
    console.log('🚀 Starting regression analysis...');
    console.log('Model specification:', modelSpec);

    try {
      // Step 1: Read data from Excel
      const allRanges = {};
      
      // Add Y variable
      if (modelSpec.y && modelSpec.ranges[modelSpec.y]) {
        allRanges[modelSpec.y] = modelSpec.ranges[modelSpec.y];
      } else {
        throw new Error('Y variable not specified or missing range');
      }
      
      // Add numeric X variables
      if (modelSpec.xn && modelSpec.xn.length > 0) {
        for (const varName of modelSpec.xn) {
          if (modelSpec.ranges[varName]) {
            allRanges[varName] = modelSpec.ranges[varName];
          } else {
            throw new Error(`Numeric variable ${varName} missing range`);
          }
        }
      }
      
      // Add categorical X variables (for now, treat as numeric)
      // TODO: Implement proper dummy coding for categorical variables
      if (modelSpec.xc && modelSpec.xc.length > 0) {
        for (const varName of modelSpec.xc) {
          if (modelSpec.ranges[varName]) {
            allRanges[varName] = modelSpec.ranges[varName];
          } else {
            throw new Error(`Categorical variable ${varName} missing range`);
          }
        }
      }
      
      // Read all data
      const data = await this.readMultipleRanges(allRanges);
      
      // Step 2: Prepare data for regression
      const y = data[modelSpec.y];
      const X = [];
      const xVarNames = [];
      
      // Add numeric predictors
      if (modelSpec.xn) {
        for (const varName of modelSpec.xn) {
          X.push(data[varName]);
          xVarNames.push(varName);
        }
      }
      
      // Add categorical predictors (as numeric for now)
      if (modelSpec.xc) {
        for (const varName of modelSpec.xc) {
          X.push(data[varName]);
          xVarNames.push(varName + ' (Cat)');
        }
      }
      
      console.log(`📊 Data prepared: Y=${modelSpec.y}, X=[${xVarNames.join(', ')}]`);
      
      // Step 3: Run regression
      const calculator = new RegressionCalculator();
      const includeIntercept = modelSpec.intercept === 1 || modelSpec.intercept === true;
      const results = calculator.calculate(y, X, includeIntercept);
      
      // Step 4: Add variable names to results
      results.yVarName = modelSpec.y;
      results.xVarNames = xVarNames;
      if (includeIntercept) {
        results.allVarNames = ['(Intercept)', ...xVarNames];
      } else {
        results.allVarNames = xVarNames;
      }
      
      // Step 5: Add raw data for other analyses
      results.rawData = data;
      
      console.log('✅ Regression analysis complete!');
      console.log(`   R² = ${results.rSquared.toFixed(4)}`);
      console.log(`   Adj R² = ${results.adjRSquared.toFixed(4)}`);
      console.log(`   F = ${results.fStat.toFixed(2)}, p = ${results.fPValue.toExponential(3)}`);
      
      return results;
    } catch (error) {
      console.error('❌ Regression analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate descriptive statistics for a variable
   * @param {Array} data - Array of values
   * @returns {Object} - Descriptive statistics
   */
  calculateDescriptiveStats(data) {
    const cleanData = data.filter(val => val !== null && val !== undefined && val !== '' && !isNaN(val));
    
    if (cleanData.length === 0) {
      return {
        n: 0,
        mean: NaN,
        median: NaN,
        sd: NaN,
        min: NaN,
        max: NaN,
        q1: NaN,
        q3: NaN
      };
    }
    
    const sorted = cleanData.slice().sort((a, b) => a - b);
    const n = cleanData.length;
    const mean = cleanData.reduce((sum, val) => sum + val, 0) / n;
    const variance = cleanData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)];
    
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    
    return {
      n: n,
      mean: mean,
      median: median,
      sd: sd,
      min: sorted[0],
      max: sorted[n - 1],
      q1: q1,
      q3: q3
    };
  }

  /**
   * Store regression results in sessionStorage
   * @param {Object} results - Regression results
   */
  storeResults(results) {
    try {
      sessionStorage.setItem('regressionResults', JSON.stringify(results));
      console.log('💾 Results stored in sessionStorage');
    } catch (error) {
      console.error('Failed to store results:', error);
      throw error;
    }
  }

  /**
   * Load regression results from sessionStorage
   * @returns {Object|null} - Regression results or null if not found
   */
  loadResults() {
    try {
      const resultsJson = sessionStorage.getItem('regressionResults');
      if (resultsJson) {
        const results = JSON.parse(resultsJson);
        console.log('📂 Results loaded from sessionStorage');
        return results;
      }
      return null;
    } catch (error) {
      console.error('Failed to load results:', error);
      return null;
    }
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ExcelIntegration = ExcelIntegration;
}
