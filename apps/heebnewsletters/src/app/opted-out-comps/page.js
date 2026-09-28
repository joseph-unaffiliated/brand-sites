'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, isRealBrowser } from '@/lib/subscription';
import { contactEmail, siteConfig, siteDisplayName } from '@/config/site';
import styles from './page.module.css';

async function processCompsOptOut(email) {
  const origin = siteConfig.magicSubscribeBase.replace(/\/?$/, '');
  const url = `${origin}/optout-comps?email=${encodeURIComponent(email)}&process=1`;
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

function OptedOutCompsContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');

  const encodedEmail = searchParams.get('email');
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'comps_optout_success', {
        event_category: 'engagement',
        event_label: 'magic_link_redirect',
      });
    }

    if (!email || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    processCompsOptOut(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [searchParams, email]);

  function retry() {
    if (!email) {
      setStatus('error');
      return;
    }
    setStatus('confirming');
    processCompsOptOut(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }

  function handleFeedback() {
    const subject = `Compilations opt-out feedback - ${BRAND}`;
    const body = email ? `User email: ${email}\n\nFeedback:\n` : 'Feedback:\n';
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>You&apos;re opted out of compilations.</h1>

        {status === 'confirming' && (
          <p className={styles.body}>Updating your preferences&hellip;</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            You will no longer receive compilation emails from {siteDisplayName}.
            Your regular newsletter subscription is unchanged.
          </p>
        )}
        {status === 'error' && (
          <p className={styles.body}>
            Something went wrong.{' '}
            <button type="button" className={styles.retryLink} onClick={retry}>
              Try again
            </button>
          </p>
        )}

        {email && status === 'done' && (
          <div className={styles.actions}>
            <a
              className="button button-secondary"
              href={`${siteConfig.magicSubscribeBase}optin-comps?email=${encodeURIComponent(email)}`}
            >
              Keep sending me compilations
            </a>
          </div>
        )}

        <button type="button" className={styles.feedbackLink} onClick={handleFeedback}>
          Share feedback
        </button>
      </div>
    </div>
  );
}

export default function OptedOutCompsPage() {
  return (
    <Suspense>
      <OptedOutCompsContent />
    </Suspense>
  );
}
