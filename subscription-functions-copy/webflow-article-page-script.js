<script>

/**
 * Article Page Subscription Handler
 * Manages email prepopulation, form submission, Turnstile verification, and toast notifications
 */

// ============================================================================
// EMAIL PREPOPULATION
// Fills the form field with email from URL parameter
// ============================================================================
function prepopulateEmailField() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedEmail = urlParams.get('email');
  
  if (!encodedEmail) {
    console.log('ℹ️ No email parameter found in URL');
    return null;
  }
  
  const email = decodeURIComponent(encodedEmail);
  console.log('📧 Email parameter detected:', email);
  
  const emailField = document.querySelector('.form-textinputfield');
  
  if (emailField) {
    // Store email for later restoration after Turnstile loads
    emailField.dataset.prepopulatedEmail = email;
    console.log('✅ Email staged for prepopulation (will be restored after Turnstile)');
    return email;
  } else {
    console.warn('⚠️ Email input field not found (.form-textinputfield)');
    return null;
  }
}

// ============================================================================
// TOAST NOTIFICATION HANDLER
// Shows toast notification when subscribed=true parameter is present
// Also mirrors success-page localStorage behavior to suppress banner
// ============================================================================
function checkAndShowSubscriptionToast() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSubscribed = urlParams.get('subscribed') === 'true';
  const encodedEmail = urlParams.get('email');
  
  if (isSubscribed) {
    const toastElement = document.getElementById('subscribedToast');
    
    if (toastElement) {
      // Show the toast
      toastElement.style.display = 'flex';
      console.log('✅ Subscription toast displayed');
    } else {
      console.warn('⚠️ Toast element (#subscribedToast) not found');
    }

    // Mirror success-page localStorage behavior
    const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
    if (brandSlug) {
      localStorage.setItem(`subscribed_${brandSlug}`, 'true');
      console.log('💾 Saved subscription to localStorage');

      if (encodedEmail) {
        localStorage.setItem(`email_${brandSlug}`, encodedEmail);
        console.log('💾 Saved email to localStorage');
      }
    }
    
    // Execute subscription action
    if (encodedEmail) {
      executeSubscriptionAction();
    }
  }
}

// ============================================================================
// EXECUTE SUBSCRIPTION ACTION
// Fires POST to /execute endpoint to complete subscription
// ============================================================================
function executeSubscriptionAction() {
  console.log('⚙️ Executing subscription action on article page...');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const isSubscribed = urlParams.get('subscribed') === 'true';
  
  if (!isSubscribed || !email) {
    return; // Not a subscription flow
  }
  
  // Extract brand from hostname
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
  
  // Get all other params for POST
  const brands = urlParams.get('brands');
  const campaignID = urlParams.get('campaignID');
  const utm_source = urlParams.get('utm_source');
  const utm_campaign = urlParams.get('utm_campaign');
  const articleID = urlParams.get('articleID');
  
  // Bot detection - be lenient, only block clear bots
  function isRealBrowser() {
    const checks = {
      hasUserAgent: !!navigator.userAgent,
      notHeadless: navigator.webdriver === undefined,
      hasPlugins: navigator.plugins && navigator.plugins.length > 0,
      localStorageWorks: (() => {
        try { 
          localStorage.setItem('__test__', '1');
          localStorage.removeItem('__test__');
          return true;
        } catch(e) { 
          return false;
        }
      })(),
      pageVisible: document.visibilityState === 'visible',
      notKnownBot: !/bot|crawler|spider|scanner|preview/i.test(navigator.userAgent)
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    return passed >= 4; // At least 4/6 checks pass
  }
  
  // Check if bot
  if (!isRealBrowser()) {
    console.log('🤖 Bot detected - not executing subscription');
    return;
  }
  
  // Prepare POST body
  const postBody = {
    email: email,
    brand: brandSlug,
    action: 'subscribe'
  };
  
  if (brands) postBody.brands = brands;
  if (campaignID) postBody.campaignID = campaignID;
  if (utm_source) postBody.utm_source = utm_source;
  if (utm_campaign) postBody.utm_campaign = utm_campaign;
  if (articleID) postBody.articleID = articleID;
  
  // Fire POST immediately
  const executeUrl = `https://magic.${brandSlug}.com/execute`;
  
  fetch(executeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postBody)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Subscription completed successfully');
    } else {
      console.error('❌ Subscription failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ POST error:', error);
  });
}

// ============================================================================
// FORM SUBMISSION HANDLER
// Intercepts form submission and redirects to magic-link API
// ============================================================================
function initializeFormSubmission() {
  const form = document.querySelector('form[data-subscribe="1"]') || 
                document.querySelector('form#wf-subscribe-form') || 
                document.querySelector('form');
  
  if (!form) {
    console.warn('⚠️ No form found');
    return;
  }
  
  // Check if handler already attached
  if (form.dataset.handlerAttached === 'true') {
    console.log('Form handler already attached, skipping');
    return;
  }
  
  // Mark as attached
  form.dataset.handlerAttached = 'true';
  console.log('📝 Form submission handler initialized');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const emailInput = form.querySelector('input[name="email"]');
    const submitBtn = form.querySelector('[type="submit"]');
    
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    if (!email) return;
    
    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }
    
    try {
      // Get UTM parameters from current page URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source') || 'webflow';
      const utmCampaign = urlParams.get('utm_campaign') || 'form_submit';
      
      // Extract brand from hostname
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const brand = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      
      // Build magic-link URL with form data
      const params = new URLSearchParams({
        email: email,
        brand: brand,
        utm_source: utmSource,
        utm_campaign: utmCampaign
      });
      
      const magicLinkUrl = `https://subscription-functions.vercel.app/api/magic-link?${params.toString()}`;
      
      // Save subscription to localStorage
      localStorage.setItem(`subscribed_${brand}`, 'true');
      console.log('💾 Saved subscription to localStorage');
      
      // Open current article page in new tab
      window.open(window.location.href, '_blank');
      
      // Redirect current tab to success page via magic-link
      window.location.href = magicLinkUrl;
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Something went wrong. Please try again.');
      
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    }
  });
}

// ============================================================================
// TURNSTILE READY CHECKER
// Waits for Turnstile to be ready, then reveals the form
// ============================================================================
function waitForTurnstileAndShow() {
  console.log('⏳ Waiting for Turnstile to be ready...');
  
  const articleForm = document.querySelector('.articlepage-form');
  const emailField = document.querySelector('.form-textinputfield');
  
  // Get prepopulated email if it exists
  const prepopulatedEmail = emailField?.dataset.prepopulatedEmail || '';
  
  if (prepopulatedEmail && emailField) {
    emailField.value = ''; // Clear it until Turnstile is ready
    console.log('📧 Saved prepopulated email, will restore after Turnstile');
  }
  
  // Hide the form
  if (articleForm) {
    articleForm.classList.add('turnstile-loading');
  }
  
  // Create and show loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'turnstile-loading-message active';
  loadingMessage.innerHTML = 'Confirming you\'re a real person<span class="loading-ellipsis"></span>';
  
  // Insert loading message after the form
  if (articleForm && articleForm.parentNode) {
    articleForm.parentNode.insertBefore(loadingMessage, articleForm.nextSibling);
  }
  
  let checkCount = 0;
  const maxChecks = 50; // Check for 5 seconds max (50 * 100ms)
  
  const checkTurnstile = setInterval(() => {
    checkCount++;
    
    const submitBtn = document.querySelector('.form-submitbutton');
    const isTurnstileReady = submitBtn && !submitBtn.disabled;
    
    console.log(`Check ${checkCount}: Turnstile ready =`, isTurnstileReady);
    
    if (isTurnstileReady) {
      clearInterval(checkTurnstile);
      console.log('✅ Turnstile is ready!');
      
      // Hide loading message
      loadingMessage.remove();
      
      // Show the form
      if (articleForm) {
        articleForm.classList.remove('turnstile-loading');
      }
      
      // Restore prepopulated email if there was one
      if (prepopulatedEmail && emailField) {
        emailField.value = prepopulatedEmail;
        console.log('✅ Restored prepopulated email');
      } else if (emailField) {
        emailField.focus(); // Only focus if not prepopulated
      }
      
    } else if (checkCount >= maxChecks) {
      clearInterval(checkTurnstile);
      console.warn('⚠️ Turnstile timeout - showing form anyway');
      
      // Hide loading message
      loadingMessage.remove();
      
      // Show the form even if Turnstile fails
      if (articleForm) {
        articleForm.classList.remove('turnstile-loading');
      }
      
      // Restore prepopulated email even on timeout
      if (prepopulatedEmail && emailField) {
        emailField.value = prepopulatedEmail;
      }
    }
  }, 100); // Check every 100ms
}

// ============================================================================
// INITIALIZATION
// Wait for DOM to be fully loaded, then initialize all handlers
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded - Starting article page initialization');
  
  // Show toast + set subscription localStorage if subscribed=true
  checkAndShowSubscriptionToast();
  
  // Check if user is already subscribed via localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0]; // Extract brand from hostname
  const isAlreadySubscribed = localStorage.getItem(`subscribed_${brandSlug}`) === 'true';
  
  if (isAlreadySubscribed) {
    console.log('✅ User already subscribed - hiding newsletter CTA');
    const newsletterSection = document.querySelector('.newslettercta-section');
    if (newsletterSection) {
      newsletterSection.style.display = 'none';
    }
  }
  
  // Check for email prepopulation
  prepopulateEmailField();
  
  // Initialize form submission handler
  initializeFormSubmission();
  
  // Wait for Turnstile to be ready
  waitForTurnstileAndShow();
});

// Backup: Also try to initialize after window fully loads
window.addEventListener('load', function() {
  // Only reinitialize if form handler wasn't attached yet
  const form = document.querySelector('form');
  if (form && !form.dataset.handlerAttached) {
    console.log('🔄 Reinitializing form handler after window load');
    initializeFormSubmission();
  }
});

// Export functions for manual use if needed
window.articleSubscriptionHandler = {
  prepopulateEmailField: prepopulateEmailField,
  initializeFormSubmission: initializeFormSubmission,
  waitForTurnstileAndShow: waitForTurnstileAndShow,
  checkAndShowSubscriptionToast: checkAndShowSubscriptionToast,
  executeSubscriptionAction: executeSubscriptionAction
};

</script>
