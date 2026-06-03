'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, executeAction, isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { contactEmail, siteConfig, siteDisplayName } from '@/config/site';
import actions from '@/components/SubscriptionPageActions.module.css';
import styles from './page.module.css';

function SnoozedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [resolvedEmail, setResolvedEmail] = useState(null);

  useEffect(() => {
    setResolvedEmail(resolveEmailFromUrlOrStorage(searchParams));
  }, [searchParams]);

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

  function handleFeedback() {
    const subject = `Snooze feedback - ${BRAND}`;
    const body = resolvedEmail ? `User email: ${resolvedEmail}\n\nFeedback:\n` : 'Feedback:\n';
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={styles.card}>
        <h1 className={styles.heading}>
          {status === 'error' && (
            <>Something went wrong when trying to snooze you.</>
          )}
          {status === 'confirming' && (
            <>Snoozing you now&hellip;</>
          )}
          {status === 'done' && (
            <>See you in 3 months.</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {status === 'done' && (
          <p className={styles.body}>
            You&apos;ve been snoozed from {siteDisplayName}.
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
              href={`${siteConfig.magicSubscribeBase}?email=${encodeURIComponent(resolvedEmail)}`}
            >
              Resubscribe me now!
            </a>
          </div>
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
