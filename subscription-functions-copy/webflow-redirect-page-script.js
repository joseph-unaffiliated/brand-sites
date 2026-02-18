<script>
/**
 * Redirect Page Handler
 * Displays site name, executes subscription, and redirects to external URL after 2 seconds
 */

(function() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const siteName = urlParams.get('sitename');
  const encodedUrl = urlParams.get('url');
  const email = urlParams.get('email');
  
  // Extract brand from hostname
  const brandSlug = window.location.hostname.split('.').slice(-2, -1)[0];
  
  // Update site name in the page
  const siteNameElement = document.getElementById('siteName');
  if (siteNameElement && siteName) {
    siteNameElement.textContent = siteName;
    console.log('✅ Site name updated:', siteName);
  } else if (!siteName) {
    console.warn('⚠️ No sitename parameter found');
  }
  
  // Execute subscription if email is present
  if (email) {
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
    
    // Execute subscription via POST
    async function executeSubscription() {
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
      
      try {
        const executeUrl = `https://magic.${brandSlug}.com/execute`;
        
        // Fire POST immediately - page will redirect after 2 seconds, so this should complete
        const response = await fetch(executeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postBody),
          keepalive: true // Keep request alive even if page unloads
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
          console.log('✅ Subscription completed successfully');
        } else {
          console.error('❌ Subscription failed:', data.error);
        }
      } catch (error) {
        console.error('❌ POST error:', error);
      }
    }
    
    // Fire immediately on page load
    executeSubscription();
  }
  
  // Decode and redirect
  if (encodedUrl) {
    try {
      // Decode base64url (URL-safe base64)
      // Replace URL-safe characters back to standard base64
      const base64 = encodedUrl.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      // Decode
      const decodedUrl = decodeURIComponent(atob(padded));
      
      console.log('🔗 Decoded redirect URL:', decodedUrl);
      
      // Validate URL
      try {
        new URL(decodedUrl);
        
        // Redirect after 2 seconds (changed from 3 to match your requirement)
        setTimeout(() => {
          console.log('🔄 Redirecting to:', decodedUrl);
          window.location.href = decodedUrl;
        }, 2000);
        
      } catch (urlError) {
        console.error('❌ Invalid decoded URL:', decodedUrl);
        // Optionally show an error message to the user
      }
      
    } catch (decodeError) {
      console.error('❌ Failed to decode URL:', decodeError);
      // Optionally show an error message to the user
    }
  } else {
    console.warn('⚠️ No url parameter found');
  }
})();
</script>
