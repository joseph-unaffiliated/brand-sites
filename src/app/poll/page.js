'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { executeAction, isRealBrowser } from '@/lib/subscription';
import styles from './page.module.css';

function PollContent() {
  const searchParams = useSearchParams();
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  const isSubscribed = searchParams.get('subscribed') === 'true';

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'poll_view', { event_category: 'engagement', event_label: 'magic_link_redirect' });
    }

    if (isSubscribed && searchParams.get('email') && isRealBrowser()) {
      executeAction(searchParams, 'subscribe')
        .then((data) => setSubscribeStatus(data.success ? 'success' : 'error'))
        .catch(() => setSubscribeStatus('error'));
    }
  }, [searchParams, isSubscribed]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {isSubscribed && (
          <p className={styles.thanks}>
            {subscribeStatus === 'success'
              ? "You're now subscribed to Hookup Lists — thanks for voting!"
              : subscribeStatus === 'error'
              ? "We had trouble confirming your subscription, but your vote was counted."
              : "Thanks for subscribing and voting!"}
          </p>
        )}

        <h1 className={styles.heading}>You&apos;re all set.</h1>
        <p className={styles.body}>
          Thanks for participating. We&apos;ll be in touch when we have more for you.
        </p>
      </div>
    </div>
  );
}

export default function PollPage() {
  return (
    <Suspense>
      <PollContent />
    </Suspense>
  );
}
