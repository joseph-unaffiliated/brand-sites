'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { contactEmail, siteConfig, siteDisplayName } from '@/config/site';
import actions from '@/components/SubscriptionPageActions.module.css';
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
  const [resolvedEmail, setResolvedEmail] = useState(null);

  useEffect(() => {
    setResolvedEmail(resolveEmailFromUrlOrStorage(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'comps_optout_success', {
        event_category: 'engagement',
        event_label: 'magic_link_redirect',
      });
    }

    const email = resolveEmailFromUrlOrStorage(searchParams);
    if (!email || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    processCompsOptOut(email)
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
    processCompsOptOut(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }

  function handleFeedback() {
    const subject = `Compilations opt-out feedback - ${BRAND}`;
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
            <>Opting you out of compilations&hellip;</>
          )}
          {status === 'done' && (
            <>You&apos;re opted out of compilations.</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            You will no longer receive compilation emails from {siteDisplayName}.
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
              href={`${siteConfig.magicSubscribeBase}optin-comps?email=${encodeURIComponent(resolvedEmail)}`}
            >
              Whoops, keep sending me compilations
            </a>
          </div>
        )}
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
