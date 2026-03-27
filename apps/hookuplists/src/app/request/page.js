'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function RequestContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'request_success', { event_category: 'engagement', event_label: 'magic_link_redirect' });
    }
  }, []);

  const email = searchParams.get('email') ? decodeURIComponent(searchParams.get('email')) : null;
  const isExisting = searchParams.get('existing') === 'true' || searchParams.get('login_sent') === 'true';

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Check your inbox.</h1>
        <p className={styles.body}>
          {isExisting ? (
            <>Check your email and follow the link to log in.</>
          ) : (
            <>
              We sent a magic link to{' '}
              {email ? <strong>{email}</strong> : 'your email address'}.
              {' '}Click it to confirm your subscription.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestContent />
    </Suspense>
  );
}
