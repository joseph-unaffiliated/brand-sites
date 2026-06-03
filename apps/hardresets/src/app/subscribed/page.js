'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRAND, executeAction, isRealBrowser } from '@/lib/subscription';
import { resolveEmailFromUrlOrStorage } from '@/lib/subscriptionLandingEmail';
import { useSubscriber } from '@/context/SubscriberContext';
import SubscriptionSuccessRecs from '@/components/SubscriptionSuccessRecs';
import actions from '@/components/SubscriptionPageActions.module.css';
import styles from './page.module.css';

function SubscribedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [recEmail, setRecEmail] = useState(null);
  const { refresh } = useSubscriber();

  useEffect(() => {
    setRecEmail(resolveEmailFromUrlOrStorage(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const encodedEmail = searchParams.get('email');
    if (!encodedEmail) {
      setStatus('no-email');
      return;
    }

    localStorage.setItem(`subscribed_${BRAND}`, 'true');
    localStorage.setItem(`email_${BRAND}`, encodedEmail);
    localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
    refresh();

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

  const showRecs = status === 'success' || status === 'no-email';

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={`${styles.card} ${actions.cardWide}`}>
        <h1 className={styles.heading}>
          {status === 'confirming' && (
            <>Confirming your subscription&hellip;</>
          )}
          {(status === 'success' || status === 'no-email') && (
            <>Thanks for subscribing.</>
          )}
          {status === 'error' && (
            <>Something went wrong when trying to confirm your subscription.</>
          )}
          {status === 'bot' && (
            <>One more step</>
          )}
        </h1>

        {status === 'confirming' && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}
        {(status === 'success' || status === 'no-email') && (
          <p className={styles.body}>Check your inbox for our welcome email.</p>
        )}
        {status === 'error' && (
          <div className={styles.errorTryAgain}>
            <button type="button" className={actions.btn} onClick={retry}>
              Try again
            </button>
          </div>
        )}
        {status === 'bot' && (
          <>
            <p className={styles.body}>
              We couldn&apos;t confirm you automatically. Use the button below to try again.
            </p>
            <div className={styles.errorTryAgain}>
              <button type="button" className={actions.btn} onClick={retry}>
                Try again
              </button>
            </div>
          </>
        )}
        {showRecs && <SubscriptionSuccessRecs email={recEmail} />}
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
