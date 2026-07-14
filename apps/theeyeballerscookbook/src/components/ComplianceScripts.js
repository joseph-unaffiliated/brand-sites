import Script from "next/script";

const PLACEHOLDER_ONETRUST = "YOUR_ONETRUST_ID_HERE";
const PLACEHOLDER_RETENTION = "YOUR_RETENTION_ID_HERE";

/**
 * Eyeballer's Cookbook OneTrust domain script — MUST be set per-brand via
 * NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT on Vercel once the OneTrust domain is
 * provisioned. Until then this falls back to the network default (Pickle's).
 */
const DEFAULT_ONETRUST_DOMAIN_SCRIPT = "019a7160-715f-710a-9141-d7af1513ef88";
/** Network-wide Retention site id (same as The '90s Parent). */
const DEFAULT_RETENTION_SITE_ID = "X2JHJ4WE";

function resolveOnetrustDomainScript() {
  const raw = process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT;
  if (raw == null || raw === "") return DEFAULT_ONETRUST_DOMAIN_SCRIPT;
  const v = raw.trim();
  if (!v || v === PLACEHOLDER_ONETRUST) return DEFAULT_ONETRUST_DOMAIN_SCRIPT;
  return v;
}

function resolveRetentionSiteId() {
  const raw = process.env.NEXT_PUBLIC_RETENTION_SITE_ID;
  if (raw == null || raw === "") return DEFAULT_RETENTION_SITE_ID;
  const v = raw.trim();
  if (!v || v === PLACEHOLDER_RETENTION) return DEFAULT_RETENTION_SITE_ID;
  return /^[A-Za-z0-9_-]+$/.test(v) ? v : DEFAULT_RETENTION_SITE_ID;
}

/** OneTrust cookie consent — load early in <head>. */
export function OneTrustScripts() {
  const domainScript = resolveOnetrustDomainScript();
  return (
    <>
      <Script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        charSet="UTF-8"
        strategy="beforeInteractive"
        data-domain-script={domainScript}
      />
      <Script id="onetrust-optanon-wrapper" strategy="beforeInteractive">
        {`function OptanonWrapper() {}`}
      </Script>
    </>
  );
}

/** Retention site snippet. */
export function RetentionScript() {
  const siteId = resolveRetentionSiteId();
  if (!/^[A-Za-z0-9_-]+$/.test(siteId)) return null;

  const inline = `!function(){var geq=window.geq=window.geq||[];if(geq.initialize)return;if(geq.invoked){if(window.console&&console.error){console.error("Retention snippet included twice.")}return}geq.invoked=!0;geq.methods=["page","suppress","track","doNotTrack","trackOrder","identify","addToCart","callBack","event"];geq.factory=function(method){return function(){var args=Array.prototype.slice.call(arguments);args.unshift(method);geq.push(args);return geq}};for(var i=0;i<geq.methods.length;i++){var key=geq.methods[i];geq[key]=geq.factory(key)}geq.load=function(key){var script=document.createElement("script");script.type="text/javascript";script.async=!0;if(location.href.indexOf("vge=true")!==-1){script.src="https://s3-us-west-2.amazonaws.com/jsstore/a/"+key+"/ge.js?v="+Math.random()}else{script.src="https://s3-us-west-2.amazonaws.com/jsstore/a/"+key+"/ge.js"}var first=document.getElementsByTagName("script")[0];first.parentNode.insertBefore(script,first)};geq.SNIPPET_VERSION="1.6.1";geq.load(${JSON.stringify(siteId)})}();`;

  return (
    <Script
      id="retention-site-snippet"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: inline }}
    />
  );
}
