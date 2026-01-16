/**
 * Excel Integration for Regression Add-in
 * Handles: Named Ranges, Range Selection, Variable Population
 */

// Global state
let currentData = {
  range: null,
  headers: [],
  values: [],
  variables: []
};

/**
 * 1. LOAD NAMED RANGES from workbook
 */
async function loadNamedRanges() {
  try {
    await Excel.run(async (context) => {
      const namedItems = context.workbook.names;
      namedItems.load('items');
      await context.sync();

      const rangeSelector = document.getElementById('rangeSelector');
      
      // Clear existing options except the first placeholder
      rangeSelector.innerHTML = '<option value="">-- Select Named Range --</option>';
      
      if (namedItems.items.length === 0) {
        rangeSelector.innerHTML += '<option value="" disabled>No named ranges found</option>';
        showStatus('leftStatus', '⚠️ No named ranges in this workbook', 'info');
        return;
      }

      // Add named ranges to dropdown
      namedItems.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        rangeSelector.appendChild(option);
      });

      showStatus('leftStatus', `✅ Loaded ${namedItems.items.length} named range(s)`, 'success');
      console.log(`Loaded ${namedItems.items.length} named ranges`);
    });
  } catch (error) {
    console.error('Error loading named ranges:', error);
    showStatus('leftStatus', `❌ Error: ${error.message}`, 'error');
  }
}

/**
 * 2. LOAD DATA from selected named range
 */
async function loadFromNamedRange() {
  const rangeSelector = document.getElementById('rangeSelector');
  const selectedName = rangeSelector.value;

  if (!selectedName) {
    showStatus('leftStatus', '⚠️ Please select a named range', 'info');
    return;
  }

  try {
    showStatus('leftStatus', `🔄 Loading ${selectedName}...`, 'info');
    
    await Excel.run(async (context) => {
      const namedItem = context.workbook.names.getItem(selectedName);
      namedItem.load('type');
      await context.sync();
      
      // Check if this is a valid range
      if (namedItem.type !== Excel.NamedItemType.range) {
        throw new Error(`"${selectedName}" is not a range (it's a ${namedItem.type})`);
      }
      
      const range = namedItem.getRange();
      range.load(['address', 'values', 'rowCount', 'columnCount']);
      await context.sync();

      console.log(`📊 Named range loaded: ${range.address}`);
      console.log(`📏 Dimensions: ${range.rowCount} rows × ${range.columnCount} columns`);
      console.log(`📋 First few values:`, range.values.slice(0, 3));

      // Store data
      currentData.range = range.address;
      currentData.values = range.values;

      // Check if we have data
      if (range.values.length === 0) {
        throw new Error('Named range is empty');
      }

      // Extract headers (first row)
      currentData.headers = range.values[0].map((h, i) => h || `Column${i + 1}`);
      
      // Data rows (excluding header)
      const dataRows = range.values.slice(1);

      console.log(`🏷️ Headers:`, currentData.headers);
      console.log(`📊 Data rows:`, dataRows.length);

      // Populate variables table
      populateVariablesTable(currentData.headers, dataRows);

      // Show unified range display with named range info
      const rangeDisplay = document.getElementById('rangeDisplay');
      const rangeIcon = document.getElementById('rangeIcon');
      const rangeTitle = document.getElementById('rangeTitle');
      const rangeDetails = document.getElementById('rangeDetails');
      
      if (rangeDisplay && rangeIcon && rangeTitle && rangeDetails) {
        rangeIcon.className = 'fa-solid fa-bookmark';
        rangeTitle.textContent = selectedName;
        rangeDetails.textContent = `${range.address} (${range.rowCount} rows × ${range.columnCount} columns)`;
        rangeDisplay.style.display = 'block';
      }

      showStatus('leftStatus', `✅ Loaded ${dataRows.length} rows, ${currentData.headers.length} columns from "${selectedName}"`, 'success');
    });
  } catch (error) {
    console.error('❌ Error loading named range:', error);
    showStatus('leftStatus', `❌ Cannot load "${selectedName}": ${error.message}`, 'error');
    
    // Clear the dropdown selection and hide display
    document.getElementById('rangeSelector').value = '';
    const rangeDisplay = document.getElementById('rangeDisplay');
    if (rangeDisplay) {
      rangeDisplay.style.display = 'none';
    }
  }
}

/**
 * 3. PICK RANGE from sheet (enhanced version)
 */
async function pickRangeEnhanced() {
  try {
    showStatus('leftStatus', '🔄 Reading selection...', 'info');
    
    await Excel.run(async (context) => {
      const range = context.workbook.getSelectedRange();
      range.load(['address', 'values', 'rowCount', 'columnCount']);
      await context.sync();

      console.log(`📊 Range picked: ${range.address}`);
      console.log(`📏 Dimensions: ${range.rowCount} rows × ${range.columnCount} columns`);
      console.log(`📋 First few values:`, range.values.slice(0, 3));

      // Check if we have data
      if (range.values.length === 0) {
        throw new Error('Selected range is empty');
      }

      if (range.values.length === 1) {
        throw new Error('Selected range has only 1 row (needs header + data)');
      }

      // Store data
      currentData.range = range.address;
      currentData.values = range.values;

      // Extract headers (first row)
      currentData.headers = range.values[0].map((h, i) => {
        const header = h || `Column${i + 1}`;
        console.log(`  Column ${i}: "${header}"`);
        return header;
      });
      
      // Data rows (excluding header)
      const dataRows = range.values.slice(1);

      console.log(`🏷️ Headers (${currentData.headers.length}):`, currentData.headers);
      console.log(`📊 Data rows: ${dataRows.length}`);

      // Populate variables table
      console.log('🔄 Calling populateVariablesTable...');
      populateVariablesTable(currentData.headers, dataRows);
      console.log('✅ populateVariablesTable completed');

      // Update display
      const addressDisplay = range.address.split('!')[1] || range.address;
      document.getElementById('customRange').value = addressDisplay;

      showStatus('leftStatus', `✅ Selected: ${range.address} (${dataRows.length} rows, ${currentData.headers.length} columns)`, 'success');
    });
  } catch (error) {
    console.error('❌ Error picking range:', error);
    showStatus('leftStatus', `❌ Error: ${error.message}`, 'error');
  }
}

/**
 * 4. POPULATE VARIABLES TABLE
 * Analyzes data and creates variable rows
 */
function populateVariablesTable(headers, dataRows) {
  console.log('📋 populateVariablesTable called with:', { 
    headers: headers, 
    dataRowsCount: dataRows?.length 
  });
  
  const tbody = document.getElementById('variablesBody');
  
  if (!tbody) {
    console.error('❌ variablesBody element not found!');
    return;
  }
  
  if (!headers || headers.length === 0) {
    console.log('⚠️ No headers provided');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
          No data loaded. Select a range above.
        </td>
      </tr>
    `;
    return;
  }

  console.log(`✅ Found ${headers.length} headers, creating table rows...`);

  // Clear existing rows
  tbody.innerHTML = '';

  // Create a row for each column/variable
  headers.forEach((header, index) => {
    // Get column data (excluding header row)
    const columnData = dataRows.map(row => row[index]);
    
    // Count non-missing values
    const nonMissing = columnData.filter(val => val !== null && val !== '' && val !== undefined).length;
    
    // Check if column is numeric
    const numericCount = columnData.filter(val => {
      return val !== null && val !== '' && val !== undefined && 
             (typeof val === 'number' || !isNaN(parseFloat(val)));
    }).length;
    const isNumeric = numericCount > 0;
    
    // Create table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="center">
        <input type="checkbox" class="var-checkbox" data-var-index="${index}" />
      </td>
      <td><strong>${header}</strong></td>
      <td class="center">${nonMissing}</td>
      <td class="center">
        <select class="var-role" data-var-index="${index}" style="width: 100%; padding: 4px;">
          <option value="">--</option>
          <option value="Y" ${isNumeric ? '' : 'disabled'}>Y (Dependent)</option>
          <option value="Xn">Xn (Numeric)</option>
          <option value="Xc">Xc (Categorical)</option>
          <option value="IGNORE">Ignore</option>
        </select>
      </td>
    `;
    
    tbody.appendChild(tr);
  });

  // Store variables info
  currentData.variables = headers.map((header, index) => ({
    name: header,
    index: index,
    data: dataRows.map(row => row[index]),
    analysis: analyzeColumn(dataRows.map(row => row[index]))
  }));

  console.log(`✅ Variables table populated with ${headers.length} variables`);
  console.log('Variables:', currentData.variables);
  console.log(`Table now has ${tbody.children.length} rows`);
  
  // Update Maximum Usable Cases display
  updateMaxUsableCases(dataRows.length);
}

/**
 * Update Maximum Usable Cases display
 */
function updateMaxUsableCases(totalRows) {
  const maxCasesEl = document.getElementById('maxCases');
  if (maxCasesEl && totalRows > 0) {
    // For initial display, show total available rows
    // (Will be updated with actual usable rows after regression prep)
    maxCasesEl.textContent = `${totalRows} available`;
    console.log(`📊 Maximum usable cases: ${totalRows} rows available`);
  }
}

/**
 * 5. ANALYZE COLUMN DATA
 * Determines if numeric or categorical and provides stats
 */
function analyzeColumn(data) {
  // Filter out empty/null values
  const validData = data.filter(val => val !== null && val !== '' && val !== undefined);
  
  if (validData.length === 0) {
    return {
      isNumeric: false,
      isCategorical: true,
      stats: 'Empty column'
    };
  }

  // Check if numeric
  const numericValues = validData.filter(val => typeof val === 'number' || !isNaN(parseFloat(val)));
  const isNumeric = numericValues.length / validData.length > 0.8; // 80% threshold

  if (isNumeric) {
    // Calculate numeric stats
    const numbers = numericValues.map(v => parseFloat(v));
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    
    return {
      isNumeric: true,
      isCategorical: false,
      stats: `Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}, Mean: ${mean.toFixed(2)}`
    };
  } else {
    // Categorical stats
    const uniqueValues = [...new Set(validData)];
    
    return {
      isNumeric: false,
      isCategorical: true,
      stats: `${uniqueValues.length} unique value(s)`
    };
  }
}

/**
 * 6. GET SELECTED VARIABLES
 * Returns variables selected for analysis
 */
function getSelectedVariables() {
  const selected = {
    Y: null,
    X: [],
    categorical: []
  };

  const roleSelects = document.querySelectorAll('.var-role');
  
  roleSelects.forEach(select => {
    const role = select.value;
    const index = parseInt(select.dataset.varIndex);
    const variable = currentData.variables[index];

    if (!role || role === 'IGNORE') return;

    if (role === 'Y') {
      selected.Y = variable;
    } else if (role === 'Xn') {
      // Xn = Numeric independent variable
      selected.X.push(variable);
    } else if (role === 'Xc') {
      // Xc = Categorical independent variable
      selected.categorical.push(variable);
    } else if (role === 'X') {
      // Legacy 'X' support
      selected.X.push(variable);
    } else if (role === 'CAT') {
      // Legacy 'CAT' support
      selected.categorical.push(variable);
    }
  });

  return selected;
}

/**
 * 7. VALIDATE SELECTION
 * Checks if variable selection is valid for regression
 */
function validateSelection() {
  const selected = getSelectedVariables();
  const errors = [];

  if (!selected.Y) {
    errors.push('Please select a dependent variable (Y)');
  }

  if (selected.X.length === 0) {
    errors.push('Please select at least one independent variable (X)');
  }

  if (selected.Y && !selected.Y.analysis.isNumeric) {
    errors.push('Dependent variable (Y) must be numeric');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    selection: selected
  };
}

/**
 * 8. EXPORT TO REGRESSION MODULE
 * Formats data for regression calculation
 */
function prepareRegressionData() {
  // Try bucket assignments first (new method), fallback to dropdowns (old method)
  if (typeof bucketAssignments !== 'undefined') {
    return prepareFromBuckets();
  } else {
    return prepareFromDropdowns();
  }
}

// NEW: Prepare data from bucket assignments
function prepareFromBuckets() {
  const errors = [];

  // Validate Y assignment
  if (!bucketAssignments.y) {
    errors.push('Please assign a Y (dependent) variable');
  }

  // Validate X assignments
  if (bucketAssignments.xn.length === 0 && bucketAssignments.xc.length === 0) {
    errors.push('Please assign at least one X (independent) variable');
  }

  if (errors.length > 0) {
    showStatus('leftStatus', `❌ ${errors.join('; ')}`, 'error');
    return null;
  }

  // Find variables by name
  const yVariable = currentData.variables.find(v => v.name === bucketAssignments.y);
  const xnVariables = bucketAssignments.xn.map(name => currentData.variables.find(v => v.name === name));
  const xcVariables = bucketAssignments.xc.map(name => currentData.variables.find(v => v.name === name));

  // First, identify complete cases (rows with valid data for ALL variables)
  const totalRows = yVariable.data.length;
  const completeCaseIndices = [];
  
  for (let i = 0; i < totalRows; i++) {
    let isComplete = true;
    
    // Check Y variable
    const yVal = parseFloat(yVariable.data[i]);
    if (isNaN(yVal)) {
      isComplete = false;
    }
    
    // Check all numeric X variables
    if (isComplete) {
      for (let xnVar of xnVariables) {
        const xVal = parseFloat(xnVar.data[i]);
        if (isNaN(xVal)) {
          isComplete = false;
          break;
        }
      }
    }
    
    // Check all categorical X variables
    if (isComplete) {
      for (let xcVar of xcVariables) {
        const xcVal = xcVar.data[i];
        if (xcVal === null || xcVal === '' || xcVal === undefined) {
          isComplete = false;
          break;
        }
      }
    }
    
    if (isComplete) {
      completeCaseIndices.push(i);
    }
  }
  
  console.log(`📊 Complete cases: ${completeCaseIndices.length} out of ${totalRows} total rows`);
  console.log(`   Excluded ${totalRows - completeCaseIndices.length} rows with missing data`);

  // Prepare categorical encodings (dummy variables) using ALL data first
  const categoricalEncodings = [];
  const categoricalVarNames = [];
  
  xcVariables.forEach(variable => {
    // Get unique categories from the data
    const uniqueCategories = [...new Set(variable.data.filter(v => v !== null && v !== '' && v !== undefined))];
    console.log(`📊 Categorical variable "${variable.name}" has ${uniqueCategories.length} categories:`, uniqueCategories);
    
    // Create dummy variables (drop first category as reference)
    for (let catIdx = 1; catIdx < uniqueCategories.length; catIdx++) {
      const category = uniqueCategories[catIdx];
      const dummyData = variable.data.map(v => (v === category ? 1 : 0));
      categoricalEncodings.push({
        variable: variable.name,
        category: category,
        data: dummyData,
        displayName: `${variable.name}_${category}`
      });
      categoricalVarNames.push(`${variable.name}_${category}`);
    }
  });

  console.log(`✅ Created ${categoricalEncodings.length} dummy variables from ${xcVariables.length} categorical variables`);

  // Now prepare Y and X using ONLY complete cases
  const Y = [];
  const X = [];
  
  for (let idx of completeCaseIndices) {
    // Add Y value
    Y.push(parseFloat(yVariable.data[idx]));
    
    // Build X row
    const row = [];
    
    // Add numeric independent variables
    xnVariables.forEach(variable => {
      const value = parseFloat(variable.data[idx]);
      row.push(value);
    });

    // Add categorical dummy variables
    categoricalEncodings.forEach(encoding => {
      row.push(encoding.data[idx]);
    });

    X.push(row);
  }
  
  const n = Y.length;

  // Variable names - combine numeric and categorical dummy names
  const allXNames = [
    ...xnVariables.map(v => v.name),
    ...categoricalVarNames
  ];

  const variableNames = {
    Y: yVariable.name,
    X: allXNames,
    categorical: xcVariables.map(v => v.name)
  };

  console.log('✅ Data prepared from buckets:', {
    Y: `${Y.length} observations`,
    X_numeric: `${xnVariables.length} numeric predictors`,
    X_categorical: `${xcVariables.length} categorical variables → ${categoricalEncodings.length} dummy variables`,
    X_total: `${allXNames.length} total predictors in model`
  });

  return {
    Y: Y,
    X: X,
    variableNames: variableNames,
    n: n,
    k: allXNames.length,
    numericCount: xnVariables.length,  // Actual numeric variables (not dummy-encoded)
    categoricalCount: xcVariables.length  // Actual categorical variables
  };
}

// OLD: Prepare data from role dropdowns
function prepareFromDropdowns() {
  const validation = validateSelection();

  if (!validation.valid) {
    showStatus('leftStatus', `❌ ${validation.errors.join('; ')}`, 'error');
    return null;
  }

  const selected = validation.selection;

  // First, identify complete cases (rows with valid data for ALL variables)
  const totalRows = selected.Y.data.length;
  const completeCaseIndices = [];
  
  for (let i = 0; i < totalRows; i++) {
    let isComplete = true;
    
    // Check Y variable
    const yVal = parseFloat(selected.Y.data[i]);
    if (isNaN(yVal)) {
      isComplete = false;
    }
    
    // Check all numeric X variables
    if (isComplete) {
      for (let xVar of selected.X) {
        const xVal = parseFloat(xVar.data[i]);
        if (isNaN(xVal)) {
          isComplete = false;
          break;
        }
      }
    }
    
    // Check all categorical X variables
    if (isComplete) {
      for (let catVar of selected.categorical) {
        const catVal = catVar.data[i];
        if (catVal === null || catVal === '' || catVal === undefined) {
          isComplete = false;
          break;
        }
      }
    }
    
    if (isComplete) {
      completeCaseIndices.push(i);
    }
  }
  
  console.log(`📊 Complete cases: ${completeCaseIndices.length} out of ${totalRows} total rows`);
  console.log(`   Excluded ${totalRows - completeCaseIndices.length} rows with missing data`);

  // Prepare categorical encodings (dummy variables)
  const categoricalEncodings = [];
  const categoricalVarNames = [];
  
  selected.categorical.forEach(variable => {
    // Get unique categories from the data
    const uniqueCategories = [...new Set(variable.data.filter(v => v !== null && v !== '' && v !== undefined))];
    console.log(`📊 Categorical variable "${variable.name}" has ${uniqueCategories.length} categories:`, uniqueCategories);
    
    // Create dummy variables (drop first category as reference)
    for (let catIdx = 1; catIdx < uniqueCategories.length; catIdx++) {
      const category = uniqueCategories[catIdx];
      const dummyData = variable.data.map(v => (v === category ? 1 : 0));
      categoricalEncodings.push({
        variable: variable.name,
        category: category,
        data: dummyData,
        displayName: `${variable.name}_${category}`
      });
      categoricalVarNames.push(`${variable.name}_${category}`);
    }
  });

  console.log(`✅ Created ${categoricalEncodings.length} dummy variables from ${selected.categorical.length} categorical variables`);

  // Now prepare Y and X using ONLY complete cases
  const Y = [];
  const X = [];
  
  for (let idx of completeCaseIndices) {
    // Add Y value
    Y.push(parseFloat(selected.Y.data[idx]));
    
    // Build X row
    const row = [];
    
    // Add numeric independent variables
    selected.X.forEach(variable => {
      const value = parseFloat(variable.data[idx]);
      row.push(value);
    });

    // Add categorical dummy variables
    categoricalEncodings.forEach(encoding => {
      row.push(encoding.data[idx]);
    });

    X.push(row);
  }
  
  const n = Y.length;

  // Variable names - combine numeric and categorical dummy names
  const allXNames = [
    ...selected.X.map(v => v.name),
    ...categoricalVarNames
  ];

  const variableNames = {
    Y: selected.Y.name,
    X: allXNames,
    categorical: selected.categorical.map(v => v.name)
  };

  return {
    Y: Y,
    X: X,
    variableNames: variableNames,
    n: n,
    k: allXNames.length,
    numericCount: selected.X.length,  // Actual numeric variables (not dummy-encoded)
    categoricalCount: selected.categorical.length  // Actual categorical variables
  };
}

// Export functions for use in main HTML
window.excelIntegration = {
  loadNamedRanges,
  loadFromNamedRange,
  pickRangeEnhanced,
  getSelectedVariables,
  validateSelection,
  prepareRegressionData
};

console.log('✅ Excel Integration module loaded');
