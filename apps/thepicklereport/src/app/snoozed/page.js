'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { executeAction, isRealBrowser } from '@/lib/subscription';
import styles from './page.module.css';

function SnoozedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'snooze_success', { event_category: 'engagement', event_label: 'magic_link_redirect' });
    }

    const encodedEmail = searchParams.get('email');
    if (!encodedEmail || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    executeAction(searchParams, 'snooze')
      .then((data) => setStatus(data.success ? 'done' : 'error'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  function retry() {
    setStatus('confirming');
    executeAction(searchParams, 'snooze')
      .then((data) => setStatus(data.success ? 'done' : 'error'))
      .catch(() => setStatus('error'));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>See you in 3 months.</h1>

        {status === 'confirming' && (
          <p className={styles.body}>Setting up your snooze&hellip;</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>You&apos;ve been snoozed from The Pickle Report. We&apos;ll see you again in 3 months.</p>
        )}
        {status === 'error' && (
          <p className={styles.body}>
            Something went wrong.{' '}
            <button className={styles.retryLink} onClick={retry}>Try again</button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SnoozedPage() {
  return (
    <Suspense>
      <SnoozedContent />
    </Suspense>
  );
}
