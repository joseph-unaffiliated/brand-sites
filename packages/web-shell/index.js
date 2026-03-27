/**
 * Shared third-party marketing scripts (ads, pixels).
 *
 * Non-technical readers: this loads the approved ad and analytics snippets
 * in a consistent order across sites. Each site still uses *its own* account IDs
 * via environment variables — we never mix one brand’s ads with another’s.
 */

import Script from "next/script";
import { Fragment, createElement } from "react";

/**
 * @param {{ adsenseClient?: string; metaPixelId?: string }} props
 */
export function MarketingScripts({ adsenseClient, metaPixelId }) {
  const children = [];
  if (adsenseClient) {
    children.push(
      createElement(Script, {
        key: "adsense",
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`,
        strategy: "afterInteractive",
        crossOrigin: "anonymous",
      })
    );
  }
  if (metaPixelId) {
    const inline = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `;
    children.push(
      createElement(Script, { key: "meta", id: "meta-pixel", strategy: "afterInteractive" }, inline)
    );
  }
  return createElement(Fragment, null, ...children);
}

/**
 * Adobe Fonts (Typekit).
 * @param {{ kitId?: string }} props
 */
export function TypekitStylesheet({ kitId = "xon1hcs" }) {
  return createElement("link", {
    rel: "stylesheet",
    href: `https://use.typekit.net/${kitId}.css`,
  });
}

export function FontAwesomeStylesheet() {
  return createElement("link", {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  });
}
