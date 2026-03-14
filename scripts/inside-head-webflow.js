<style>
  .main-section {
    background: linear-gradient(to bottom, {{wf {&quot;path&quot;:&quot;main-gradient-top&quot;,&quot;type&quot;:&quot;Color&quot;\} }} 0%, {{wf {&quot;path&quot;:&quot;main-gradient-bottom&quot;,&quot;type&quot;:&quot;Color&quot;\} }} 100%) !important;
  }
  .footer-section-brand {
    background: linear-gradient(to bottom, {{wf {&quot;path&quot;:&quot;footer-gradient-top&quot;,&quot;type&quot;:&quot;Color&quot;\} }} 0%, {{wf {&quot;path&quot;:&quot;footer-gradient-bottom&quot;,&quot;type&quot;:&quot;Color&quot;\} }} 100%) !important;
  }
  .main-section, .main-content, .disclaimer-link, .main-brandrecs-header, .main-success-header, .sitelink, .footer-link, .footer-nolink, .unsub-copy-text {
    color: {{wf {&quot;path&quot;:&quot;font-color&quot;,&quot;type&quot;:&quot;Color&quot;\} }} !important;
  }
  .main-content,
  .main-success,
  .main-unsub,
  .main-snoozed,
  .main-poll,  
  .main-request {
    opacity: 0;
  transition: opacity 0.2s ease-in-out;
  }
  
  .form-submitbutton:disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
	}
  

/* Hide form while loading */
.main-form.turnstile-loading {
  display: none;
}

/* Loading message */
.turnstile-loading-message {
  display: none;
  text-align: center;
  padding: 0px 0px;
  font-size: 11px;
  opacity: 0.3;
  height: 64px;
}

.turnstile-loading-message.active {
  display: block;
}

/* Animated ellipsis */
.loading-ellipsis::after {
  content: '';
  animation: ellipsis 7s infinite;
}

@keyframes ellipsis {
  0% { content: ' '; }
  10% { content: ' .'; }
  20% { content: ' ..'; }
  30% { content: ' ...'; }
  40% { content: ' ....'; }
  50% { content: ' .....'; }
  60% { content: ' ......'; }
  70% { content: ' .......'; }
  80% { content: ' ........'; }
  90% { content: ' .........'; }
  100% { content: ' .........'; }
}
</style>