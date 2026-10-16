'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { contactEmail, siteConfig, siteDisplayName } from '@/config/site';
import actions from '@/components/SubscriptionPageActions.module.css';
import styles from './page.module.css';

async function processMarketingOptOut(email) {
  const origin = siteConfig.magicSubscribeBase.replace(/\/?$/, '');
  const url = `${origin}/optout-marketing?email=${encodeURIComponent(email)}&process=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'optout_failed');
  }
  return data;
}

function OptedOutMarketingContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [resolvedEmail, setResolvedEmail] = useState(null);

  useEffect(() => {
    setResolvedEmail(resolveEmailFromUrlOrStorage(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'marketing_optout_success', {
        event_category: 'engagement',
        event_label: 'magic_link_redirect',
      });
    }

    const email = resolveEmailFromUrlOrStorage(searchParams);
    if (!email || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    processMarketingOptOut(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  function retry() {
    const email = resolveEmailFromUrlOrStorage(searchParams);
    if (!email) {
      setStatus('error');
      return;
    }
    setStatus('confirming');
    processMarketingOptOut(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }

  function handleFeedback() {
    const subject = `Marketing emails opt-out feedback - ${BRAND}`;
    const body = resolvedEmail ? `User email: ${resolvedEmail}\n\nFeedback:\n` : 'Feedback:\n';
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={styles.card}>
        <h1 className={styles.heading}>
          {status === 'error' && (
            <>Something went wrong when trying to update your preferences.</>
          )}
          {status === 'confirming' && (
            <>Opting you out of marketing emails&hellip;</>
          )}
          {status === 'done' && (
            <>You&apos;re opted out of marketing emails.</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            You will no longer receive marketing emails from {siteDisplayName}.
            Your regular newsletter subscription is unchanged.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.errorTryAgain}>
            <button type="button" className={actions.btn} onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {resolvedEmail && status === 'done' && (
          <div className={`${actions.actionRow} ${actions.actionRowNowrap}`}>
            <button type="button" className={actions.btn} onClick={handleFeedback}>
              Send feedback
            </button>
            <a
              className={`${actions.btn} ${actions.btnPrimary}`}
              href={`${siteConfig.magicSubscribeBase}optin-marketing?email=${encodeURIComponent(resolvedEmail)}`}
            >
              Whoops, keep sending me marketing emails
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OptedOutMarketingPage() {
  return (
    <Suspense>
      <OptedOutMarketingContent />
    </Suspense>
  );
}
