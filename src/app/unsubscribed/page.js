'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, executeAction, isRealBrowser } from '@/lib/subscription';
import styles from './page.module.css';

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');

  const encodedEmail = searchParams.get('email');
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;

  useEffect(() => {
    localStorage.removeItem(`subscribed_${BRAND}`);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'unsubscribe_success', { event_category: 'engagement', event_label: 'magic_link_redirect' });
    }

    if (!encodedEmail || !isRealBrowser()) {
      setStatus('done');
      return;
    }

    executeAction(searchParams, 'unsubscribe')
      .then((data) => setStatus(data.success ? 'done' : 'error'))
      .catch(() => setStatus('error'));
  }, [searchParams, encodedEmail]);

  function retry() {
    setStatus('confirming');
    executeAction(searchParams, 'unsubscribe')
      .then((data) => setStatus(data.success ? 'done' : 'error'))
      .catch(() => setStatus('error'));
  }

  function handleFeedback() {
    const subject = `Unsubscribe Feedback - ${BRAND}`;
    const body = email ? `User email: ${email}\n\nFeedback:\n` : 'Feedback:\n';
    window.location.href = `mailto:contact@unaffiliated.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>You&apos;ve been unsubscribed.</h1>

        {status === 'confirming' && (
          <p className={styles.body}>Unsubscribing you now&hellip;</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>We&apos;re sorry to see you go. You&apos;ve been removed from Hookup Lists.</p>
        )}
        {status === 'error' && (
          <p className={styles.body}>
            Something went wrong.{' '}
            <button className={styles.retryLink} onClick={retry}>Try again</button>
          </p>
        )}

        {email && (
          <div className={styles.actions}>
            <a
              className="button button-secondary"
              href={`https://magic.hookuplists.com/?email=${encodeURIComponent(email)}`}
            >
              Resubscribe
            </a>
            <a
              className="button button-secondary"
              href={`https://magic.hookuplists.com/snooze?email=${encodeURIComponent(email)}`}
            >
              Snooze instead
            </a>
          </div>
        )}

        <button className={styles.feedbackLink} onClick={handleFeedback}>
          Share feedback
        </button>
      </div>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
