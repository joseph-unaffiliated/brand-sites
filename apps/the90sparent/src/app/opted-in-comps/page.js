'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { siteConfig, siteDisplayName } from '@/config/site';
import actions from '@/components/SubscriptionPageActions.module.css';
import styles from './page.module.css';

async function processCompsOptIn(email) {
  const origin = siteConfig.magicSubscribeBase.replace(/\/?$/, '');
  const url = `${origin}/optin-comps?email=${encodeURIComponent(email)}&process=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'optin_failed');
  }
  return data;
}

function OptedInCompsContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    const email = resolveEmailFromUrlOrStorage(searchParams);
    if (!email || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    processCompsOptIn(email)
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
    processCompsOptIn(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={styles.card}>
        <h1 className={styles.heading}>
          {status === 'error' && (
            <>Something went wrong when trying to update your preferences.</>
          )}
          {status === 'confirming' && (
            <>Restoring compilations&hellip;</>
          )}
          {status === 'done' && (
            <>You&apos;re back on compilations.</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            We&apos;ll keep sending compilation emails from {siteDisplayName}.
          </p>
        )}
        {status === 'error' && (
          <div className={styles.errorTryAgain}>
            <button type="button" className={actions.btn} onClick={retry}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OptedInCompsPage() {
  return (
    <Suspense>
      <OptedInCompsContent />
    </Suspense>
  );
}
