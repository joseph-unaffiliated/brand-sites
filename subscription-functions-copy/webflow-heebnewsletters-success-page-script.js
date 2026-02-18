<script>

/**
 * Subscription Page Handler - Heeb Newsletters
 * Manages page states, email prepopulation, subscription buttons, and form submission
 */

// ============================================================================
// PAGE STATE HANDLER
// Shows/hides different screens based on URL parameters
// ============================================================================
function checkPageState() {
  console.log('🔍 Checking page state...');
  console.log('🔗 Current URL:', window.location.href);
  console.log('🔗 URL search params:', window.location.search);
  
  // Get URL parameters - read these FIRST before any cleanup
  const urlParams = new URLSearchParams(window.location.search);
  const isSubscribed = urlParams.get('subscribed') === 'true';
  const isUnsubscribed = urlParams.get('unsubscribed') === 'true';
  const isSnoozed = urlParams.get('snoozed') === 'true';
  const isRequest = urlParams.get('request') === 'true';
  const isPoll = urlParams.has('poll'); // Check if poll parameter exists (with or without value)
  const encodedEmail = urlParams.get('email');
  
  console.log('📋 URL params detected:', { isSubscribed, isUnsubscribed, isSnoozed, isRequest, isPoll, hasEmail: !!encodedEmail });
  
  // Store action state for executeSubscriptionAction (before URL is cleaned)
  window._pendingSubscriptionAction = null;
  if (isSubscribed && encodedEmail) {
    window._pendingSubscriptionAction = 'subscribe';
    console.log('✅ Stored pending action: subscribe');
  } else if (isUnsubscribed && encodedEmail) {
    window._pendingSubscriptionAction = 'unsubscribe';
    console.log('✅ Stored pending action: unsubscribe');
  } else if (isSnoozed && encodedEmail) {
    window._pendingSubscriptionAction = 'snooze';
    console.log('✅ Stored pending action: snooze');
  } else {
    console.log('⚠️ No pending action stored');
  }
  
  // Extract brand from hostname for localStorage
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
  
  // Check if already subscribed via localStorage
  const isAlreadySubscribed = localStorage.getItem(`subscribed_${brandSlug}`) === 'true';
  
  console.log('Parameters:', { isSubscribed, isUnsubscribed, isSnoozed, isRequest, isPoll, hasEmail: !!encodedEmail, isAlreadySubscribed });
  
  // Get all six screens (main-request is optional)
  const mainContent = document.querySelector('.main-content');
  const mainSuccess = document.querySelector('.main-success');
  const mainUnsub = document.querySelector('.main-unsub');
  const mainSnoozed = document.querySelector('.main-snoozed');
  const mainPoll = document.querySelector('.main-poll');
  const mainRequest = document.querySelector('.main-request');
  
  console.log('Elements found:', {
    mainContent: !!mainContent,
    mainSuccess: !!mainSuccess,
    mainUnsub: !!mainUnsub,
    mainSnoozed: !!mainSnoozed,
    mainPoll: !!mainPoll,
    mainRequest: !!mainRequest
  });
  
  // Check if all screens exist
  if (!mainContent || !mainSuccess || !mainUnsub || !mainSnoozed || !mainPoll) {
    console.warn('⚠️ One or more page screens not found.');
    return;
  }
  
  // Hide main-request on all other screens
  if (mainRequest) mainRequest.style.display = 'none';

  // Check poll FIRST (highest priority)
  if (isPoll) {
    console.log('✅ Showing poll screen');
    mainContent.style.display = 'none';
    mainSuccess.style.display = 'none';
    mainUnsub.style.display = 'none';
    mainSnoozed.style.display = 'none';
    mainPoll.style.display = 'flex';
    
    // Show poll thanks message if subscribed=true
    if (isSubscribed) {
      const pollThanksMessage = document.querySelector('.poll-thanksmessage');
      if (pollThanksMessage) {
        pollThanksMessage.style.display = 'block';
        console.log('✅ Showing poll thanks message');
      }
    }
    
    trackEvent('poll_view');
    
    // Execute subscription if subscribed=true on poll page
    if (window._pendingSubscriptionAction === 'subscribe' && encodedEmail) {
      console.log('📤 Executing subscription action (poll page)');
      executeSubscriptionAction('subscribe');
    }
    
    cleanUrl('poll');
    return { isPoll: true };
  } else if (isSnoozed) {
    console.log('✅ Showing snoozed screen');
    mainContent.style.display = 'none';
    mainSuccess.style.display = 'none';
    mainUnsub.style.display = 'none';
    mainSnoozed.style.display = 'flex';
    mainPoll.style.display = 'none';

    trackEvent('snooze_success');
    
    // Execute snooze action BEFORE cleaning URL
    if (window._pendingSubscriptionAction === 'snooze' && encodedEmail) {
      console.log('📤 Executing subscription action (snooze)');
      executeSubscriptionAction('snooze');
    }
    
    cleanUrl('snoozed');
  } else if (isUnsubscribed) {
    console.log('✅ Showing unsubscribe screen');
    mainContent.style.display = 'none';
    mainSuccess.style.display = 'none';
    mainUnsub.style.display = 'flex';
    mainSnoozed.style.display = 'none';
    mainPoll.style.display = 'none';

    // Remove subscription from localStorage
    localStorage.removeItem(`subscribed_${brandSlug}`);
    console.log('🗑️ Removed subscription from localStorage');

    trackEvent('unsubscribe_success');
    
    // Execute unsubscribe action BEFORE cleaning URL
    if (window._pendingSubscriptionAction === 'unsubscribe' && encodedEmail) {
      console.log('📤 Executing subscription action (unsubscribe)');
      executeSubscriptionAction('unsubscribe');
    }
    
    cleanUrl('unsubscribed');
  } else if (isRequest && mainRequest) {
    console.log('✅ Showing request screen');
    mainContent.style.display = 'none';
    mainSuccess.style.display = 'none';
    mainUnsub.style.display = 'none';
    mainSnoozed.style.display = 'none';
    mainPoll.style.display = 'none';
    mainRequest.style.display = 'flex';

    trackEvent('request_success');
    cleanUrl('request');
  } else if (isSubscribed || isAlreadySubscribed) {
    console.log('✅ Showing success screen');
    mainContent.style.display = 'none';
    mainSuccess.style.display = 'flex';
    mainUnsub.style.display = 'none';
    mainSnoozed.style.display = 'none';
    mainPoll.style.display = 'none';
    
    // Save subscription to localStorage if coming from URL parameter
    if (isSubscribed) {
      localStorage.setItem(`subscribed_${brandSlug}`, 'true');
      console.log('💾 Saved subscription to localStorage');
      
      // Also save email to localStorage if available
      if (encodedEmail) {
        localStorage.setItem(`email_${brandSlug}`, encodedEmail);
        console.log('💾 Saved email to localStorage');
      }
    }
    
    trackEvent('subscription_success');
    if (typeof fbq !== 'undefined') fbq('track', 'Lead');
    // Google Ads conversion tracking
    if (typeof gtag !== 'undefined') {
    gtag('event', 'conversion', {'send_to': 'AW-17856709988/yAjBCImA9tObP05K38JC'});
    console.log('📊 Google Ads: Newsletter Signup conversion tracked');
    }

    // Execute subscription action BEFORE cleaning URL
    // Use stored action state (captured before URL cleanup)
    if (window._pendingSubscriptionAction === 'subscribe' && encodedEmail) {
      console.log('📤 Executing subscription action (subscribe)');
      executeSubscriptionAction('subscribe');
    }
    
    // Only clean URL if subscribed parameter was actually in URL
    if (isSubscribed) {
      cleanUrl('subscribed');
    }
  } else {
    console.log('✅ Showing main content');
    mainContent.style.display = 'flex';
    mainSuccess.style.display = 'none';
    mainUnsub.style.display = 'none';
    mainSnoozed.style.display = 'none';
    mainPoll.style.display = 'none';
    if (mainRequest) mainRequest.style.display = 'none';
    
    // If there's an email parameter, prepopulate the form
    if (encodedEmail) {
      prepopulateEmailField(encodedEmail);
    }
  }
  
  // Hide all buttons if there's no email parameter
  if (!encodedEmail) {
    const hideButtons = () => {
      const buttons = document.querySelectorAll('.button');
      buttons.forEach(button => {
        button.style.setProperty('display', 'none', 'important');
      });
      if (buttons.length > 0) {
        console.log(`🔒 Hiding ${buttons.length} button(s) (no email parameter)`);
      }
    };
    
    // Hide immediately
    hideButtons();
    
    // Also hide after delays to catch any late-loading buttons
    setTimeout(hideButtons, 100);
    setTimeout(hideButtons, 500);
    setTimeout(hideButtons, 1000);
  }
  
  // Return which screen is visible
  return { isSubscribed: isSubscribed || isAlreadySubscribed, isUnsubscribed, isSnoozed, isRequest };
}

// ============================================================================
// EXECUTE SUBSCRIPTION ACTION
// Fires POST to /execute endpoint to complete subscription/unsubscribe/snooze
// ============================================================================
function executeSubscriptionAction(actionOverride = null) {
  console.log('⚙️ Executing subscription action...');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  
  // Extract brand from hostname
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
  
  // Determine action - use override if provided, otherwise check URL
  let action = actionOverride;
  if (!action) {
    const isSubscribed = urlParams.get('subscribed') === 'true';
    const isUnsubscribed = urlParams.get('unsubscribed') === 'true';
    const isSnoozed = urlParams.get('snoozed') === 'true';
    
    if (isUnsubscribed) action = 'unsubscribe';
    else if (isSnoozed) action = 'snooze';
    else if (isSubscribed) action = 'subscribe';
  }
  
  if (!action) {
    console.log('⚠️ No subscription action detected');
    return;
  }
  
  if (!email) {
    console.warn('⚠️ No email parameter found');
    return;
  }
  
  // Get all other params for POST
  const brands = urlParams.get('brands');
  const campaignID = urlParams.get('campaignID');
  const utm_source = urlParams.get('utm_source');
  const utm_campaign = urlParams.get('utm_campaign');
  const articleID = urlParams.get('articleID');
  
  // Find message elements
  const subscribedMessage = document.getElementById('subscribed-message-gem');
  const unsubCopyText = document.getElementById('unsub-copy-text');
  const snoozeCopyText = document.getElementById('snooze-copy-text');
  
  function updateMessage(element, text, isError = false) {
    if (element) {
      element.textContent = text;
      if (isError) {
        element.style.color = '#d32f2f';
      } else {
        // Reset to original color (remove inline style to use CSS)
        element.style.color = '';
      }
    }
  }
  
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
    console.log('🤖 Bot detected - not executing action');
    if (action === 'subscribe' && subscribedMessage) {
      updateMessage(subscribedMessage, 'Please click below to confirm your subscription.');
      subscribedMessage.style.cursor = 'pointer';
      subscribedMessage.onclick = function() {
        executeSubscriptionAction('subscribe');
      };
    }
    return;
  }
  
  // Show loading message based on action
  if (action === 'subscribe' && subscribedMessage) {
    updateMessage(subscribedMessage, 'Confirming your subscription to');
  } else if (action === 'unsubscribe' && unsubCopyText) {
    updateMessage(unsubCopyText, 'You\'re now being unsubscribed');
  } else if (action === 'snooze' && snoozeCopyText) {
    updateMessage(snoozeCopyText, 'You\'re now being snoozed');
  }
  
  // Prepare POST body
  const postBody = {
    email: email,
    brand: brandSlug,
    action: action
  };
  
  if (brands) postBody.brands = brands;
  if (campaignID) postBody.campaignID = campaignID;
  if (utm_source) postBody.utm_source = utm_source;
  if (utm_campaign) postBody.utm_campaign = utm_campaign;
  if (articleID) postBody.articleID = articleID;
  
  // Fire POST immediately - use sendBeacon for reliability
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
      // Success!
      if (action === 'subscribe' && subscribedMessage) {
        updateMessage(subscribedMessage, 'You\'re now subscribed to');
      } else if (action === 'unsubscribe' && unsubCopyText) {
        updateMessage(unsubCopyText, 'We\'re sorry to see you go');
      } else if (action === 'snooze' && snoozeCopyText) {
        updateMessage(snoozeCopyText, 'See you in 3 months!');
      }
      console.log('✅ Subscription action completed successfully');
    } else {
      // Error
      if (action === 'subscribe' && subscribedMessage) {
        updateMessage(subscribedMessage, 'Subscription failed [click to retry]');
        subscribedMessage.style.cursor = 'pointer';
        subscribedMessage.onclick = function() {
          executeSubscriptionAction('subscribe');
        };
      } else if (action === 'unsubscribe' && unsubCopyText) {
        updateMessage(unsubCopyText, 'Unsubscription failed [click to retry]');
        unsubCopyText.style.cursor = 'pointer';
        unsubCopyText.onclick = function() {
          executeSubscriptionAction('unsubscribe');
        };
      } else if (action === 'snooze' && snoozeCopyText) {
        updateMessage(snoozeCopyText, 'Snooze failed [click to retry]');
        snoozeCopyText.style.cursor = 'pointer';
        snoozeCopyText.onclick = function() {
          executeSubscriptionAction('snooze');
        };
      }
      console.error('❌ Subscription action failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ POST error:', error);
    if (action === 'subscribe' && subscribedMessage) {
      updateMessage(subscribedMessage, 'Subscription failed [click to retry]');
      subscribedMessage.style.cursor = 'pointer';
      subscribedMessage.onclick = function() {
        executeSubscriptionAction('subscribe');
      };
    } else if (action === 'unsubscribe' && unsubCopyText) {
      updateMessage(unsubCopyText, 'Unsubscription failed [click to retry]');
      unsubCopyText.style.cursor = 'pointer';
      unsubCopyText.onclick = function() {
        executeSubscriptionAction('unsubscribe');
      };
    } else if (action === 'snooze' && snoozeCopyText) {
      updateMessage(snoozeCopyText, 'Snooze failed [click to retry]');
      snoozeCopyText.style.cursor = 'pointer';
      snoozeCopyText.onclick = function() {
        executeSubscriptionAction('snooze');
      };
    }
  });
}

// ============================================================================
// SHOW PAGE - Called after determining page state
// ============================================================================
function showPage() {
  console.log('✅ Showing page');
  
  const mainContent = document.querySelector('.main-content');
  const mainSuccess = document.querySelector('.main-success');
  const mainUnsub = document.querySelector('.main-unsub');
  const mainSnoozed = document.querySelector('.main-snoozed');
  const mainPoll = document.querySelector('.main-poll');
  const mainRequest = document.querySelector('.main-request');
  
  // Fade in the visible screen
  [mainContent, mainSuccess, mainUnsub, mainSnoozed, mainPoll, mainRequest].forEach(el => {
    if (el && el.style.display !== 'none') {
      setTimeout(() => {
        el.style.opacity = '1';
      }, 50); // Small delay for smooth transition
    }
  });
}

// ============================================================================
// EMAIL PREPOPULATION
// Fills the form field with email from URL parameter
// NOTE: This is called during checkPageState, but the email will be cleared
// by waitForTurnstileAndShow and restored after Turnstile is ready
// ============================================================================
function prepopulateEmailField(encodedEmail) {
  const email = decodeURIComponent(encodedEmail);
  console.log('📧 Email parameter detected:', email);
  
  const emailField = document.querySelector('.form-textinputfield');
  
  if (emailField) {
    // Set the value temporarily - it will be cleared and restored by waitForTurnstileAndShow
    emailField.value = email;
    console.log('✅ Email staged for prepopulation (will be restored after Turnstile)');
  } else {
    console.warn('⚠️ Email input field not found (.form-textinputfield)');
  }
}

// ============================================================================
// SUBSCRIPTION BUTTONS HANDLER
// Handles resubscribe and cross-subscribe buttons
// ============================================================================
function initializeSubscriptionButtons() {
  console.log('🔘 Initializing subscription buttons...');
  
  const urlParams = new URLSearchParams(window.location.search);
  let encodedEmail = urlParams.get('email');
  
  // If no email in URL, try to get it from localStorage
  if (!encodedEmail) {
    const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
    const storedEmail = localStorage.getItem(`email_${brandSlug}`);
    
    if (storedEmail) {
      encodedEmail = storedEmail;
      console.log('📧 Email restored from localStorage:', storedEmail);
    } else {
      console.warn('⚠️ No email parameter found in URL or localStorage');
      return;
    }
  }
  
  const email = decodeURIComponent(encodedEmail);
  console.log('📧 Decoded email:', email);
  
  const buttons = document.querySelectorAll('.button[id]');
  console.log(`Found ${buttons.length} button(s) with IDs`);
  
  buttons.forEach(button => {
    const buttonId = button.id;
    console.log('Setting up button:', buttonId);
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      let targetUrl;
      
      if (buttonId === 'unsub-resub') {
        targetUrl = `https://magic.heebnewsletters.com/?email=${encodeURIComponent(email)}`;
        console.log('🔄 Resubscribing to brand:', targetUrl);
      } else if (buttonId === 'unsub-snooze') {
        targetUrl = `https://magic.heebnewsletters.com/snooze?email=${encodeURIComponent(email)}`;
        console.log('😴 Snoozing for brand:', targetUrl);
      } else {
        targetUrl = `https://magic.${buttonId}.com/?email=${encodeURIComponent(email)}`;
        console.log('➡️ Cross-subscribing to:', buttonId, '|', targetUrl);
      }
      
      window.location.href = targetUrl;
    });
  });
}

// ============================================================================
// SITE LINKS HANDLER
// Handles links to brand websites with email parameter (if available)
// ============================================================================
function initializeSiteLinks() {
  console.log('🔗 Initializing site links...');
  
  const urlParams = new URLSearchParams(window.location.search);
  let encodedEmail = urlParams.get('email');
  
  // If no email in URL, try to get it from localStorage
  if (!encodedEmail) {
    const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
    const storedEmail = localStorage.getItem(`email_${brandSlug}`);
    
    if (storedEmail) {
      encodedEmail = storedEmail;
      console.log('📧 Email restored from localStorage for site links:', storedEmail);
    } else {
      console.log('ℹ️ No email parameter found in URL or localStorage - site links will work without email');
    }
  }
  
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;
  if (email) {
    console.log('📧 Email for site links:', email);
  }
  
  const sitelinks = document.querySelectorAll('.sitelink[id]');
  console.log(`Found ${sitelinks.length} sitelink(s) with IDs`);
  
  sitelinks.forEach(link => {
    const linkId = link.id;
    console.log('Setting up sitelink:', linkId);
    
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Build URL with email parameter only if email exists
      let targetUrl = `https://${linkId}.com/`;
      if (email) {
        targetUrl += `?email=${encodeURIComponent(email)}`;
      }
      
      console.log('🌐 Going to site:', linkId, '|', targetUrl);
      
      window.location.href = targetUrl;
    });
  });
}

// ============================================================================
// FEEDBACK BUTTON HANDLER
// Handles the unsubscribe feedback button to send email
// ============================================================================
function initializeFeedbackButton() {
  console.log('💬 Initializing feedback button...');
  
  const feedbackButton = document.getElementById('unsub-feedback');
  
  if (!feedbackButton) {
    console.warn('⚠️ Feedback button not found (#unsub-feedback)');
    return;
  }
  
  feedbackButton.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Get user's email from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const encodedEmail = urlParams.get('email');
    const userEmail = encodedEmail ? decodeURIComponent(encodedEmail) : '';
    
    // Get brand name from hostname
    const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
    
    // Create mailto link with subject and body
    const subject = `Unsubscribe Feedback - ${brandSlug}`;
    const body = userEmail ? `User email: ${userEmail}\n\nFeedback:\n` : 'Feedback:\n';
    
    const mailtoLink = `mailto:contact@unaffiliated.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    console.log('📧 Opening email client for feedback');
    window.location.href = mailtoLink;
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
      
      // Build magic-link URL with form data
      const params = new URLSearchParams({
        email: email,
        brand: 'heebnewsletters',
        utm_source: utmSource,
        utm_campaign: utmCampaign
      });
      
      const magicLinkUrl = `https://subscription-functions.vercel.app/api/magic-link?${params.toString()}`;
      
      // Redirect to magic-link endpoint
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
// Waits for Turnstile to be ready, then shows the page
// ============================================================================
function waitForTurnstileAndShow() {
  console.log('⏳ Waiting for Turnstile to be ready...');
  
  const mainForm = document.querySelector('.main-form');
  const emailField = document.querySelector('.form-textinputfield');
  
  // Check if there's a prepopulated email to add later
  const urlParams = new URLSearchParams(window.location.search);
  const encodedEmail = urlParams.get('email');
  let prepopulatedEmail = '';
  
  if (emailField && emailField.value) {
    prepopulatedEmail = emailField.value;
    emailField.value = ''; // Clear it until Turnstile is ready
    console.log('📧 Saved prepopulated email, will restore after Turnstile');
  }
  
  // Hide the form
  if (mainForm) {
    mainForm.classList.add('turnstile-loading');
  }
  
  // Create and show loading message
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'turnstile-loading-message active';
  loadingMessage.innerHTML = 'Confirming you\'re a real person<span class="loading-ellipsis"></span>';
  
  // Insert loading message after the form
  if (mainForm && mainForm.parentNode) {
    mainForm.parentNode.insertBefore(loadingMessage, mainForm.nextSibling);
  }
  
  // Show the page immediately (but with loading message instead of form)
  showPage();
  
  let checkCount = 0;
  const maxChecks = 100; // Increased to 10 seconds (100 * 100ms)
  let wasReadyOnce = false;
  
  const checkTurnstile = setInterval(() => {
    checkCount++;
    
    const submitBtn = document.querySelector('.form-submitbutton');
    const isTurnstileReady = submitBtn && !submitBtn.disabled;
    
    console.log(`Check ${checkCount}: Turnstile ready =`, isTurnstileReady);
    
    if (isTurnstileReady) {
      // Mark that we've seen it ready at least once
      if (!wasReadyOnce) {
        wasReadyOnce = true;
        console.log('✅ Turnstile appears ready, waiting 1 more second to confirm...');
      }
      
      // Wait for 10 consecutive "ready" checks (1 second total) before showing
      if (wasReadyOnce && checkCount >= 10) {
        let consecutiveReadyChecks = 0;
        
        // Do 10 more rapid checks to ensure it stays enabled
        const finalCheck = setInterval(() => {
          consecutiveReadyChecks++;
          const stillReady = submitBtn && !submitBtn.disabled;
          
          if (!stillReady) {
            // If it becomes disabled again, reset
            clearInterval(finalCheck);
            wasReadyOnce = false;
            console.log('⚠️ Button became disabled again, continuing to wait...');
          } else if (consecutiveReadyChecks >= 10) {
            // All checks passed - show the form!
            clearInterval(finalCheck);
            clearInterval(checkTurnstile);
            console.log('✅ Turnstile fully ready and stable!');
            
            // Hide loading message
            loadingMessage.remove();
            
            // Show the form
            if (mainForm) {
              mainForm.classList.remove('turnstile-loading');
            }
            
            // Restore prepopulated email if there was one
            if (prepopulatedEmail && emailField) {
              emailField.value = prepopulatedEmail;
              console.log('✅ Restored prepopulated email');
            } else if (emailField) {
              emailField.focus();
            }
          }
        }, 100);
      }
    }
    
    if (checkCount >= maxChecks) {
      clearInterval(checkTurnstile);
      console.warn('⚠️ Turnstile timeout - showing form anyway');
      
      // Hide loading message
      loadingMessage.remove();
      
      // Show the form even if Turnstile fails
      if (mainForm) {
        mainForm.classList.remove('turnstile-loading');
      }
      
      // Restore prepopulated email even on timeout
      if (prepopulatedEmail && emailField) {
        emailField.value = prepopulatedEmail;
      }
    }
  }, 100); // Check every 100ms
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function cleanUrl(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.replaceState({}, '', url);
  console.log('Cleaned URL, removed:', param);
}

function trackEvent(eventName) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      event_category: 'engagement',
      event_label: 'magic_link_redirect'
    });
  }
  
  if (typeof analytics !== 'undefined') {
    analytics.track(eventName, {
      source: 'magic_link',
      timestamp: new Date().toISOString()
    });
  }
  
  if (eventName === 'subscription_success' && typeof fbq !== 'undefined') {
    fbq('track', 'Lead');
    console.log('📊 Meta Pixel: Lead tracked');
  }
  
  console.log(`✅ ${eventName} tracked`);
}

// ============================================================================
// INITIALIZATION
// Wait for DOM to be fully loaded, then initialize all handlers
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded - Starting initialization');
  
  // Add CSS rule to hide buttons when no email parameter
  const initUrlParams = new URLSearchParams(window.location.search);
  const initEncodedEmail = initUrlParams.get('email');
  if (!initEncodedEmail) {
    // Inject CSS to hide all buttons
    const style = document.createElement('style');
    style.id = 'hide-buttons-no-email-style';
    style.textContent = `
      .button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log('📝 Added CSS rule to hide buttons (no email parameter)');
  }
  
  // Check which page state we're in
  const pageState = checkPageState();
  
  // Initialize subscription buttons (for success/unsub screens)
  initializeSubscriptionButtons();
  
  // Initialize site links
  initializeSiteLinks();
  
  // Initialize feedback button
  initializeFeedbackButton();
  
  // Initialize form submission
  initializeFormSubmission();
  
  // If we're on the main content screen (with form), wait for Turnstile
  // Otherwise, show the page immediately
  // Reuse urlParams from earlier in this function
  const isSubscribed = initUrlParams.get('subscribed') === 'true';
  const isUnsubscribed = initUrlParams.get('unsubscribed') === 'true';
  const isSnoozed = initUrlParams.get('snoozed') === 'true';
  const isRequest = initUrlParams.get('request') === 'true';
  const isPoll = initUrlParams.has('poll'); // Check if poll parameter exists (with or without value)
  
  // Extract brand from hostname for localStorage check
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
  const isAlreadySubscribed = localStorage.getItem(`subscribed_${brandSlug}`) === 'true';
  
  if (!isSubscribed && !isUnsubscribed && !isSnoozed && !isPoll && !isRequest && !isAlreadySubscribed) {
    // Main content screen - wait for Turnstile
    console.log('📝 Main content detected - waiting for Turnstile');
    waitForTurnstileAndShow();
  } else {
    // Success, unsub, snoozed, poll, or request screen - show immediately (no form/Turnstile)
    console.log('✅ Success/Unsub/Snoozed/Poll/Request screen - showing immediately');
    showPage();
  }
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
window.subscriptionHandler = {
  checkPageState: checkPageState,
  showPage: showPage,
  initializeSubscriptionButtons: initializeSubscriptionButtons,
  initializeSiteLinks: initializeSiteLinks,
  initializeFeedbackButton: initializeFeedbackButton,
  initializeFormSubmission: initializeFormSubmission,
  waitForTurnstileAndShow: waitForTurnstileAndShow,
  executeSubscriptionAction: executeSubscriptionAction
};

</script>
