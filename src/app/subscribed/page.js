'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, executeAction, isRealBrowser } from '@/lib/subscription';
import styles from './page.module.css';

function SubscribedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    const encodedEmail = searchParams.get('email');
    if (!encodedEmail) {
      setStatus('no-email');
      return;
    }

    localStorage.setItem(`subscribed_${BRAND}`, 'true');
    localStorage.setItem(`email_${BRAND}`, encodedEmail);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', { send_to: 'AW-17856709988/yAjBCImA9tObP05K38JC' });
      gtag('event', 'subscription_success', { event_category: 'engagement', event_label: 'magic_link_redirect' });
    }
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Lead');
    }

    if (!isRealBrowser()) {
      setStatus('bot');
      return;
    }

    executeAction(searchParams, 'subscribe')
      .then((data) => setStatus(data.success ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  function retry() {
    setStatus('confirming');
    executeAction(searchParams, 'subscribe')
      .then((data) => setStatus(data.success ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>You&apos;re in.</h1>

        {status === 'confirming' && (
          <p className={styles.body}>Confirming your subscription to Hookup Lists&hellip;</p>
        )}
        {status === 'success' && (
          <p className={styles.body}>You&apos;re now subscribed to Hookup Lists. Check your inbox for the next issue.</p>
        )}
        {status === 'error' && (
          <p className={styles.body}>
            Something went wrong confirming your subscription.{' '}
            <button className={styles.retryLink} onClick={retry}>Try again</button>
          </p>
        )}
        {status === 'bot' && (
          <p className={styles.body}>
            Please{' '}
            <button className={styles.retryLink} onClick={retry}>click here</button>{' '}
            to confirm your subscription.
          </p>
        )}
        {status === 'no-email' && (
          <p className={styles.body}>Your subscription is confirmed.</p>
        )}
      </div>
    </div>
  );
}

export default function SubscribedPage() {
  return (
    <Suspense>
      <SubscribedContent />
    </Suspense>
  );
}
