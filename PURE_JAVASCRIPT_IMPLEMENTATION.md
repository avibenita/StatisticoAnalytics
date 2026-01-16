# Pure JavaScript Implementation

## Overview

The StatisticoAnalytics regression module is now **100% pure JavaScript** with **NO VB6 dependencies**. All regression calculations and Excel integration are handled client-side using Office.js.

## What Changed

### ✅ **Removed VB6 Dependencies**
- Eliminated all `sendToHost()` calls that communicated with VB6
- No external processes or localhost servers required
- Self-contained module that runs entirely in the browser

### ✅ **Added Pure JavaScript Regression Calculator**
**File:** `js/regression-calculator.js`

Complete OLS (Ordinary Least Squares) regression implementation including:
- Multiple linear regression
- Coefficient calculation
- Standard errors, t-statistics, p-values
- Confidence intervals (95%)
- R², Adjusted R², RMSE
- F-test and ANOVA
- VIF (Variance Inflation Factor) for multicollinearity detection
- AIC and BIC for model comparison

**No external dependencies** - uses only native JavaScript for:
- Matrix operations (multiplication, transpose, inversion)
- Statistical distributions (t, F)
- Missing value handling

### ✅ **Added Excel Integration Module**
**File:** `js/excel-integration.js`

Handles all Excel interactions using Office.js:
- Read data from Excel ranges
- Extract multiple variables at once
- Run regression analysis on Excel data
- Calculate descriptive statistics
- Store/load results in sessionStorage

### ✅ **Updated Input Panel**
**File:** `input.html`

- Integrated `RegressionCalculator` and `ExcelIntegration`
- "Run Analysis" button now:
  1. Validates model specification
  2. Reads data from Excel using Office.js
  3. Calculates regression using pure JavaScript
  4. Stores results in sessionStorage
  5. Navigates to results page
- Shows progress messages during calculation
- Displays error messages if calculation fails

### ✅ **Updated Results Page**
**File:** `index.html` and `js/regression-core.js`

- Loads regression results from sessionStorage
- Populates all fields with calculated values:
  - Model information (n, df, variables)
  - Model fit statistics (R², Adj R², RMSE, AIC, BIC)
  - F-test results
  - Coefficients table with significance stars
  - Regression equation
- Shows "No results" message if no analysis has been run
- Added "New Analysis" button to return to input panel

## Architecture

```
┌─────────────────┐
│   input.html    │  ← User selects data & configures model
│                 │
│  Uses Office.js │  ← Reads Excel data directly
│  to read Excel  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  regression-    │  ← Pure JavaScript regression
│  calculator.js  │    calculations (no VB6)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ sessionStorage  │  ← Results stored client-side
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   index.html    │  ← Display results
│                 │
│ regression-     │  ← Loads and formats results
│ core.js         │
└─────────────────┘
```

## Usage Workflow

### 1. **Open Input Panel**
- Load `input.html` in Excel (via Office Add-in manifest)
- Select Excel ranges for variables
- Assign variables to Y, Xn (numeric), and Xc (categorical)
- Choose whether to include intercept

### 2. **Run Analysis**
- Click "Run Analysis" button
- JavaScript reads Excel data using Office.js
- Regression calculated entirely in JavaScript
- Results stored in sessionStorage
- Automatically navigates to results page

### 3. **View Results**
- `index.html` loads results from sessionStorage
- All statistics displayed in formatted tables
- Use navigation dropdown to explore:
  - Regression Results
  - ANOVA
  - Residual Analysis
  - Diagnostics
  - Predictions
  - Descriptive Statistics
  - Correlation Analysis

### 4. **Run New Analysis**
- Click "New Analysis" button to return to input panel
- Previous results are overwritten when new analysis is run

## Technical Details

### Regression Algorithm
The implementation uses standard OLS formulas:

```
β = (X'X)⁻¹ X'y
```

Where:
- `β` = regression coefficients
- `X` = design matrix (predictors)
- `y` = response variable
- `X'` = transpose of X
- `⁻¹` = matrix inverse

### Statistical Tests
- **t-tests:** Each coefficient tested against null hypothesis (β = 0)
- **F-test:** Overall model significance
- **VIF:** Multicollinearity detection (VIF > 10 indicates high multicollinearity)

### P-values and Confidence Intervals
- P-values calculated using t-distribution approximation
- 95% confidence intervals using t-critical values
- Significance stars: *** p<0.001, ** p<0.01, * p<0.05, . p<0.1

## Deployment

The module is deployed to GitHub Pages:
- **Repository:** https://github.com/avibenita/StatisticoAnalytics
- **Live URL:** https://www.statistico.live/StatisticoAnalytics/

All files are served statically - no server-side processing required.

## Office.js Manifest

The manifest (`manifest.xml`) points to:
- **Entry point:** `input.html`
- **Icons:** `assets/` folder

To sideload in Excel:
1. Copy `manifest.xml` URL to Excel Add-ins
2. Or use Office Dev Center to deploy organization-wide

## Browser Compatibility

Requires:
- **Office.js** (provided by Excel Add-in host)
- **Modern browser** with ES6 support (used by Excel Add-ins)
- **sessionStorage** API

## Future Enhancements

Potential additions:
- **Categorical variable encoding:** Full dummy coding for categorical predictors
- **Robust standard errors:** HC0, HC1, HC2, HC3 options
- **Bootstrap confidence intervals:** Non-parametric alternative
- **Residual plots:** Interactive charts using Chart.js or similar
- **Model comparison:** Side-by-side comparison of multiple models
- **Export results:** Download as CSV, Excel, or PDF

## Testing

To test the implementation:
1. Open `input.html` in Excel as an Add-in
2. Select some numeric columns from your data
3. Assign one as Y, others as Xn
4. Click "Run Analysis"
5. Verify results match those from R, Python, or other stats software

## Support

For issues or questions:
- Check browser console for error messages
- Verify Excel ranges contain numeric data
- Ensure sufficient observations (n > k + 2)
- Check for missing values (automatically removed)

---

**Last Updated:** January 16, 2026  
**Version:** 2.0 (Pure JavaScript)  
**Author:** StatisticoAnalytics Development Team
