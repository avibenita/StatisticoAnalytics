/**
 * Navigation Manager for StatisticoAnalytics
 * Handles dropdown menu and page navigation with regression context
 */

// Global array to store regression variables (for navigation context)
let regressionVariablesList = [];

// Dropdown toggle functionality
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (!dropdownBtn || !dropdownContent) {
      console.warn('⚠️ Dropdown elements not found');
      return;
    }

    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
      dropdownBtn.classList.toggle('open');
    });

    window.addEventListener('click', function() {
      dropdownContent.classList.remove('show');
      dropdownBtn.classList.remove('open');
    });

    dropdownContent.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Intercept clicks on dropdown links to store regression context
    dropdownContent.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // If navigating to descriptive statistics, store regression variables
        if (href === 'descriptive-stats.html') {
          console.log('📊 Navigating to Descriptive Statistics from regression');
          
          if (regressionVariablesList.length > 0) {
            console.log('✅ Storing regression variables:', regressionVariablesList);
            sessionStorage.setItem('regressionModelVariables', JSON.stringify(regressionVariablesList));
            sessionStorage.setItem('loadFromRegression', 'true');
          } else {
            console.warn('⚠️ No regression variables available yet');
          }
        }
        
        // If navigating to correlation analysis, store regression variables
        if (href === 'correlation-analysis.html') {
          console.log('📊 Navigating to Correlation Analysis from regression');
          
          if (regressionVariablesList.length > 0) {
            console.log('✅ Storing regression variables:', regressionVariablesList);
            sessionStorage.setItem('regressionModelVariables', JSON.stringify(regressionVariablesList));
            sessionStorage.setItem('loadFromRegression', 'true');
          }
        }
      });
    });
    
    console.log('✅ Navigation initialized');
  });
})();

// Function to set regression variables list
window.setRegressionVariablesList = function(variablesArray) {
  console.log('📥 setRegressionVariablesList called');
  
  if (typeof variablesArray === 'string') {
    try {
      regressionVariablesList = JSON.parse(variablesArray);
      console.log('✅ Regression variables list set:', regressionVariablesList);
    } catch (e) {
      console.error('❌ Error parsing variables array:', e);
    }
  } else if (Array.isArray(variablesArray)) {
    regressionVariablesList = variablesArray;
    console.log('✅ Regression variables list set:', regressionVariablesList);
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setRegressionVariablesList,
    regressionVariablesList
  };
}
