# StatisticoAnalytics

**Self-Contained Regression Analysis Module**

A complete, standalone regression analysis toolkit built with pure HTML, CSS, and JavaScript. No server required, no dependencies, just open and use!

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://avibenita.github.io/StatisticoAnalytics/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/deployed-GitHub%20Pages-blue)](https://avibenita.github.io/StatisticoAnalytics/)

## 🚀 Live Demo

👉 **[Try it now](https://avibenita.github.io/StatisticoAnalytics/)**

## ✨ Features

### Regression Analysis
- ✅ **Multiple Regression** (OLS) with intercept/no-intercept options
- ✅ **Model Fit Statistics** (R², Adjusted R², AIC, BIC, RMSE)
- ✅ **F-Test** for overall model significance
- ✅ **Coefficient Table** with t-tests, p-values, and confidence intervals
- ✅ **VIF** (Variance Inflation Factors) for multicollinearity detection
- ✅ **Regression Equation** display

### Diagnostics & Residuals
- ✅ **Residual Plots** (vs. fitted, vs. predictors)
- ✅ **Q-Q Plot** for normality assessment
- ✅ **Cook's Distance** for influential observations
- ✅ **Leverage Statistics**
- ✅ **Heteroscedasticity Tests**
- ✅ **Durbin-Watson** for autocorrelation

### Predictions
- ✅ **Interactive Prediction Calculator**
- ✅ **Confidence Intervals** for mean prediction
- ✅ **Prediction Intervals** for individual observations
- ✅ **Fitted vs. Actual** plots

### Data Analysis
- ✅ **Descriptive Statistics** for regression variables
- ✅ **Correlation Matrix** for predictor relationships
- ✅ **Histogram & Distribution** visualizations
- ✅ **Normality Tests** (Shapiro-Wilk, Anderson-Darling, etc.)

## 📁 Structure

```
StatisticoAnalytics/
├── index.html                    → Main regression results
├── residual-analysis.html        → Residual diagnostics
├── diagnostics.html              → Advanced diagnostics
├── predictions.html              → Prediction tools
├── descriptive-stats.html        → Descriptive statistics
├── correlation-analysis.html     → Correlation matrix
├── data-methods.html             → Model documentation
│
├── js/
│   ├── navigation.js             → Dropdown navigation
│   ├── regression-core.js        → Core regression calculations
│   ├── statistics.js             → Statistical functions
│   └── charts.js                 → Visualization library
│
├── css/
│   └── main.css                  → Styles and theme
│
├── data/
│   └── sample-regression.json    → Sample dataset
│
└── assets/
    └── icons/                    → UI icons
```

## 🎯 Quick Start

### Method 1: Use GitHub Pages (Easiest)
Just visit: https://avibenita.github.io/StatisticoAnalytics/

### Method 2: Clone and Run Locally
```bash
git clone https://github.com/avibenita/StatisticoAnalytics.git
cd StatisticoAnalytics
# Open index.html in your browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Method 3: Download ZIP
1. Click "Code" → "Download ZIP"
2. Extract the archive
3. Double-click `index.html`

## 📊 Usage

### Loading Data

**Option 1: Sample Data** (Built-in)
- Click "Load Sample Data" button
- Pre-loaded example dataset appears

**Option 2: Upload JSON**
```javascript
// Your data format
{
  "y": [23, 45, 67, ...],
  "x": [
    [12, 34, 56, ...],  // X1
    [78, 90, 12, ...]   // X2
  ],
  "variableNames": ["Y", "Income", "Age"],
  "includeIntercept": true
}
```

**Option 3: Manual Input**
- Use the data entry form
- Paste from Excel
- Enter values manually

### Navigation

Use the dropdown menu to navigate between:

```
📊 Regression Results    → Main coefficients and fit statistics
📉 Residual Analysis     → Plots and diagnostic tests
🔍 Diagnostics           → Influence and multicollinearity
🎯 Predictions           → Calculator and intervals
───────────────
📈 Descriptive Statistics → Summary stats for model variables
🔗 Correlation Analysis   → Correlation matrix
───────────────
📝 Data & Methods         → Model documentation
```

### Contextual Navigation

When you navigate from **Regression Results** to **Descriptive Statistics** or **Correlation Analysis**:
- The system automatically remembers your regression variables
- Shows statistics **only for the variables in your model**
- Maintains context across pages using `sessionStorage`

Example:
```
Your regression: Y ~ Income + Age + Education
  ↓
Click "Descriptive Statistics"
  ↓
Shows descriptive stats for: Y, Income, Age, Education only
(not all 50 variables in your dataset)
```

## 🎨 Features in Detail

### Regression Results Page (`index.html`)

**Model Fit Panel:**
- Observations count
- R² and Adjusted R²
- Root Mean Square Error
- AIC and BIC for model comparison
- F-statistic and p-value

**Coefficients Table:**
- Variable names
- Coefficient estimates
- Standard errors
- t-values and p-values
- 95% Confidence intervals
- VIF (multicollinearity check)

**Regression Equation:**
- Mathematical formula display
- Toggle show/hide
- Formatted with coefficients

### Residual Analysis (`residual-analysis.html`)

- Residuals vs. Fitted values
- Q-Q plot for normality
- Scale-Location plot
- Residuals vs. Leverage
- Histogram of residuals

### Diagnostics (`diagnostics.html`)

- Cook's Distance plot
- Leverage (hat values)
- DFBETAS (influence on coefficients)
- DFFITS (influence on fitted values)
- Condition Number
- Correlation matrix of predictors

### Predictions (`predictions.html`)

Interactive calculator:
1. Enter values for each predictor
2. Get instant prediction
3. See confidence interval (for mean)
4. See prediction interval (for individual)

### Descriptive Statistics (`descriptive-stats.html`)

For each variable in the regression:
- N (sample size)
- Mean, Median, Mode
- Standard Deviation
- Min, Max, Range
- Skewness, Kurtosis
- Interactive histogram
- Normality tests

### Correlation Analysis (`correlation-analysis.html`)

- Pearson correlation matrix
- Heatmap visualization
- Significance tests (p-values)
- Scatter plot matrix

## 🛠️ Technical Details

### Technologies
- **Pure HTML5** - No frameworks needed
- **Vanilla JavaScript** - ES6+ features
- **CSS3** - Modern styling with custom properties
- **D3.js** (CDN) - For visualizations
- **Highcharts** (CDN) - For charts
- **Font Awesome** (CDN) - For icons

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### No Dependencies Required
- No Node.js
- No npm/yarn
- No build process
- No server

### Works Offline
Once loaded, can work completely offline (except CDN resources - cache these for full offline use).

## 📦 Integration

### Embed in Your Website
```html
<iframe src="https://avibenita.github.io/StatisticoAnalytics/" 
        width="100%" height="800px" frameborder="0">
</iframe>
```

### Use as Excel Add-in
Compatible with Excel Online API - can be integrated as a custom add-in.

### Link from Other Modules
```html
<!-- From CorrelationAnalytics module -->
<a href="https://avibenita.github.io/StatisticoAnalytics/">
  Run Regression Analysis →
</a>
```

## 🎓 Other Modules

StatisticoAnalytics is part of a family of self-contained analytics modules:

- **[StatisticoAnalytics](https://github.com/avibenita/StatisticoAnalytics)** - Regression (This repo)
- **[CorrelationAnalytics](https://github.com/avibenita/CorrelationAnalytics)** - Correlation & Association
- **[DescriptiveAnalytics](https://github.com/avibenita/DescriptiveAnalytics)** - Descriptive Statistics
- **[TimeSeriesAnalytics](https://github.com/avibenita/TimeSeriesAnalytics)** - Time Series Analysis

Each module is:
- ✅ Self-contained
- ✅ Independently deployable
- ✅ Shares same design language
- ✅ Can link to each other

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
git clone https://github.com/avibenita/StatisticoAnalytics.git
cd StatisticoAnalytics
# Edit files with your favorite editor
# Test by opening index.html in browser
```

### Testing
- Open `index.html` in multiple browsers
- Test all navigation links
- Verify calculations with known datasets
- Check responsive design on mobile

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 📧 Contact

- **Author:** avibenita
- **GitHub:** [@avibenita](https://github.com/avibenita)
- **Issues:** [Report a bug](https://github.com/avibenita/StatisticoAnalytics/issues)

## 🙏 Acknowledgments

- Built with modern web standards
- Inspired by R, SPSS, and SAS statistical software
- Uses Font Awesome for icons
- Charts powered by D3.js and Highcharts

---

**Star ⭐ this repo if you find it useful!**

**Made with ❤️ for data analysts and researchers**
