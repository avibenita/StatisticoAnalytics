# Unified Two-Panel UI Implementation

## Overview

The **`regression-unified.html`** file is a complete, self-contained two-panel interface that **exactly mimics** the structure and design of the original `regression-unified.html` from `c:\OfficeAddins\OLD\`, but with **100% pure JavaScript** and **NO VB6 dependencies**.

## Architecture

### **Two-Panel Layout**

```
┌─────────────────────────────────────────────────────────┐
│                    Excel Add-in Window                   │
├────────────────────┬────────────────────────────────────┤
│   LEFT PANEL       │        RIGHT PANEL                 │
│   (Input)          │        (Results)                   │
│   420px fixed      │        Flexible width              │
│                    │                                    │
│ • Data Selection   │ • Stats Panels                     │
│ • Named Ranges     │ • Model Fit (R², RMSE, AIC)        │
│ • Variable List    │ • F-Test                           │
│ • Model Assignment │ • ANOVA Table                      │
│   - Y (Response)   │ • Coefficients Table               │
│   - Xn (Numeric)   │ • Navigation Dropdown              │
│   - Xc (Categ.)    │                                    │
│ • Options          │                                    │
│ • Run Button       │                                    │
│                    │                                    │
└────────────────────┴────────────────────────────────────┘
```

### **Panel Behavior**

1. **On Startup:**
   - Left panel is **full width**
   - Right panel is **hidden**
   - User selects data and assigns variables

2. **After Running Regression:**
   - Left panel shrinks to **420px**
   - Right panel **appears** with results
   - Both panels visible side-by-side

## Key Features

### **Left Panel (Input)**

#### 1. **Data Selection**
- **Named Ranges Dropdown:** Load pre-defined Excel named ranges
- **Auto-detect:** Automatically detect data region around active cell
- **Manual Selection:** Select any range in Excel and click "Use Selection"
- **Live Preview:** Shows selected range address and dimensions

#### 2. **Variables Table**
- Lists all columns from selected range
- Shows variable name, N (valid observations), and assignment buttons
- **Assignment Buttons:** Y, Xn, Xc for each variable
- Active assignments highlighted
- Click to toggle assignment

#### 3. **Model Assignment (3 Buckets)**
- **Tabbed Interface:**
  - Y (Response) - Single variable
  - X (numeric) - Multiple numeric predictors
  - X (Categ.) - Multiple categorical predictors
- **Drop Zones:** Shows assigned variables as chips with remove buttons
- **Counts:** Tab badges show number of assigned variables

#### 4. **Actions**
- **Intercept Checkbox:** Include/exclude intercept term
- **Run Regression Button:** Executes analysis
- **Clear All Button:** Reset everything
- **Status Messages:** Success/error feedback

#### 5. **Maximum Usable Cases**
- Real-time calculation of valid observations
- Automatically excludes rows with missing values
- Updates when variables are assigned/unassigned

### **Right Panel (Results)**

#### 1. **Navigation Dropdown**
- Links to other analysis pages:
  - Regression Results (current page)
  - Residual Analysis
  - Diagnostics
  - Predictions
  - Descriptive Statistics
  - Correlation Analysis

#### 2. **Stats Panels (3 Cards)**

**Sample Info:**
- Used Observations
- Include Intercept?
- Numeric Variables count
- Categorical Variables count

**Model Fit:**
- R² (R-squared)
- Adjusted R²
- Root MSE (RMSE)
- AIC (Akaike Information Criterion)

**F-Test:**
- F-Statistic
- P-value
- Sum of Squares (Model)

#### 3. **ANOVA Table**
- Source (Model, Residual, Total)
- Sum of Squares
- Degrees of Freedom (df)
- Mean Square
- F-statistic
- Pr(>F) p-value

#### 4. **Coefficients Table**
- Variable names (Intercept, predictors)
- Estimate (coefficient value)
- Standard Error
- t-value
- Pr(>|t|) p-value with significance stars
- 95% Confidence Interval (Lower, Upper)

**Significance Stars:**
- `***` p < 0.001
- `**` p < 0.01
- `*` p < 0.05
- `.` p < 0.1

## Pure JavaScript Implementation

### **Data Flow**

```
1. User selects Excel range
   ↓
2. Office.js reads data from Excel
   ↓
3. JavaScript parses headers and values
   ↓
4. User assigns variables to Y, Xn, Xc
   ↓
5. User clicks "Run Regression"
   ↓
6. RegressionCalculator performs OLS
   ↓
7. Results displayed in right panel
   ↓
8. No VB6, no server calls, all client-side!
```

### **Key Technologies**

1. **Office.js:** Excel data reading
   - Read named ranges
   - Read selected ranges
   - Monitor selection changes

2. **RegressionCalculator (js/regression-calculator.js):**
   - Matrix operations
   - OLS calculation
   - Statistical tests
   - VIF, AIC, BIC

3. **ExcelIntegration (js/excel-integration.js):**
   - Data reading wrapper
   - Descriptive statistics
   - Session storage management

4. **Pure JavaScript UI:**
   - Tab switching
   - Drag-free variable assignment (click-based)
   - Dynamic table rendering
   - Status messages
   - Dropdown menus

## Differences from Original

| Feature | Original (VB6) | New (Pure JS) |
|---------|---------------|---------------|
| **Regression Calculation** | VB6 backend | JavaScript (client-side) |
| **Excel Communication** | VB6 sendToHost() | Office.js APIs |
| **Results Display** | VB6 populates HTML | JavaScript populates HTML |
| **Dependencies** | Requires VB6 process | Self-contained |
| **Deployment** | Localhost required | GitHub Pages compatible |
| **Speed** | Network round-trip | Instant (client-side) |
| **Maintainability** | VB6 + HTML | Pure JavaScript |

## CSS Theme

The design uses the **exact same CSS theme** as the original:

- **Dark Mode:** Professional dark theme with high contrast
- **Color Palette:**
  - Surface 0: `#0c1624` (background)
  - Surface 1: `#1a1f2e` (panels)
  - Surface 2: `#242938` (sections)
  - Accent 1: `rgb(255,165,120)` (orange - Y assignments)
  - Accent 2: `rgb(120,200,255)` (blue - Xn assignments)
  - Accent 3: `rgb(152,195,121)` (green - Xc assignments)

- **Typography:** Segoe UI, 14px base
- **Buttons:** Gradient backgrounds, hover effects
- **Tables:** Hover highlights, zebra striping
- **Status Messages:** Color-coded (success=green, error=red, info=blue)

## Usage Instructions

### **1. Open in Excel**
```
File → Options → Add-ins → Manage Excel Add-ins → Go
→ Sideload manifest.xml
```

### **2. Select Data**
- **Option A:** Choose from Named Ranges dropdown
- **Option B:** Click "Auto-detect" to find data region
- **Option C:** Select cells in Excel, click "Use Selection"

### **3. Assign Variables**
- Review variables table
- Click **Y** button for response variable
- Click **Xn** buttons for numeric predictors
- Click **Xc** buttons for categorical predictors
- View assignments in the tabbed buckets below

### **4. Configure Model**
- Check/uncheck "Intercept" checkbox
- Review "Maximum Usable Cases" (auto-calculated)

### **5. Run Analysis**
- Click **"Run Regression"** button
- Wait for calculation (instant on client-side)
- Right panel appears with results

### **6. Explore Results**
- Review stats panels at top
- Scroll to ANOVA table
- Review coefficients table with significance
- Use Navigation dropdown to explore other analyses

## File Structure

```
GITHUB_REPO/
├── regression-unified.html          ← MAIN ENTRY POINT (two-panel UI)
├── input.html                        ← OLD standalone input (deprecated)
├── index.html                        ← OLD standalone results (deprecated)
├── manifest.xml                      ← Points to regression-unified.html
├── js/
│   ├── regression-calculator.js     ← OLS regression engine
│   ├── excel-integration.js         ← Office.js wrapper
│   ├── regression-core.js           ← Results display (for index.html)
│   └── navigation.js                ← Shared navigation
├── css/
│   └── main.css                     ← Shared styles (for other pages)
├── assets/
│   └── icon2-*.png                  ← Add-in icons
├── residual-analysis.html
├── diagnostics.html
├── predictions.html
├── descriptive-stats.html
├── correlation-analysis.html
├── data-methods.html
├── anova.html
├── README.md
├── DEPLOYMENT_GUIDE.md
├── PURE_JAVASCRIPT_IMPLEMENTATION.md
└── UNIFIED_UI_IMPLEMENTATION.md     ← This file
```

## Testing

### **Recommended Test Data**

Use Excel data with:
- 1 header row
- 3+ columns (1 for Y, 2+ for X)
- 20+ observations
- Numeric values (or coded categorical 0/1/2)
- Some missing values (to test handling)

### **Expected Results**

Compare with R or Python:

**R Code:**
```r
model <- lm(Y ~ X1 + X2, data = mydata)
summary(model)
```

**Python Code:**
```python
import statsmodels.api as sm
X = sm.add_constant(df[['X1', 'X2']])
model = sm.OLS(df['Y'], X).fit()
print(model.summary())
```

Results should match (within rounding):
- Coefficients
- Standard errors
- t-statistics
- p-values
- R², Adjusted R²
- F-statistic

## Known Limitations

1. **Categorical Variables:**
   - Currently treated as numeric
   - Full dummy coding not yet implemented
   - User should pre-code categories as 0/1/2 etc.

2. **VIF Calculation:**
   - Approximate for large datasets
   - May show NaN for intercept (expected)

3. **Panel Resizing:**
   - Fixed 420px left panel width
   - Not user-adjustable (matches original)

## Future Enhancements

- [ ] Drag-and-drop variable assignment
- [ ] Full dummy coding for categorical variables
- [ ] Interaction terms builder
- [ ] Model comparison (side-by-side)
- [ ] Export results to Excel
- [ ] Charts and visualizations (Chart.js)
- [ ] Robust standard errors (HC0-HC3)
- [ ] Weighted regression
- [ ] Stepwise selection

## Support

**Issues?**
1. Check browser console (F12) for errors
2. Verify Excel data is numeric
3. Ensure sufficient observations (n > k + 2)
4. Check for excessive missing values

**Questions?**
- Review `PURE_JAVASCRIPT_IMPLEMENTATION.md`
- Check `README.md` for deployment
- Inspect code comments in `regression-unified.html`

---

**Last Updated:** January 16, 2026  
**Version:** 2.0 (Unified Pure JavaScript)  
**File:** regression-unified.html  
**Manifest Entry:** https://www.statistico.live/StatisticoAnalytics/regression-unified.html
