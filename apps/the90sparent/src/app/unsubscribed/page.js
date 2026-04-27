'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, executeAction, isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { contactEmail, siteConfig, siteDisplayName } from '@/config/site';
import actions from '@/components/SubscriptionPageActions.module.css';
import styles from './page.module.css';

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [resolvedEmail, setResolvedEmail] = useState(null);

  useEffect(() => {
    setResolvedEmail(resolveEmailFromUrlOrStorage(searchParams));
  }, [searchParams]);

  const encodedEmail = searchParams.get('email');

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
    const body = resolvedEmail ? `User email: ${resolvedEmail}\n\nFeedback:\n` : 'Feedback:\n';
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={styles.card}>
        <h1 className={styles.heading}>
          {status === 'error' && (
            <>Something went wrong when trying to unsubscribe you.</>
          )}
          {status === 'confirming' && (
            <>Unsubscribing you now&hellip;</>
          )}
          {status === 'done' && (
            <>We&apos;re sorry to see you go.</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            You&apos;ve been unsubscribed from {siteDisplayName}.
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
              className={actions.btn}
              href={`${siteConfig.magicSubscribeBase}snooze?email=${encodeURIComponent(resolvedEmail)}`}
            >
              Snooze for 3 months instead
            </a>
            <a
              className={`${actions.btn} ${actions.btnPrimary}`}
              href={`${siteConfig.magicSubscribeBase}?email=${encodeURIComponent(resolvedEmail)}`}
            >
              Whoops! Resubscribe me
            </a>
          </div>
        )}
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
