'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isRealBrowser } from '@/lib/subscription';
import { siteConfig, siteDisplayName } from '@/config/site';
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

  const encodedEmail = searchParams.get('email');
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;

  useEffect(() => {
    if (!email || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    processCompsOptIn(email)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [searchParams, email]);

  function retry() {
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
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>You&apos;re back on compilations.</h1>

        {status === 'confirming' && (
          <p className={styles.body}>Updating your preferences&hellip;</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            We&apos;ll keep sending compilation emails from {siteDisplayName}.
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
