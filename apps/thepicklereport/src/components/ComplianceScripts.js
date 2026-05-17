import Script from "next/script";

function resolveOnetrustDomainScript() {
  const v = process.env.NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT?.trim();
  return v || null;
}

function resolveRetentionSiteId() {
  const v = process.env.NEXT_PUBLIC_RETENTION_SITE_ID?.trim();
  return v && /^[A-Za-z0-9_-]+$/.test(v) ? v : null;
}

/** OneTrust — only when NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT is set on Vercel. */
export function OneTrustScripts() {
  const domainScript = resolveOnetrustDomainScript();
  if (!domainScript) return null;
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

/** Retention — only when NEXT_PUBLIC_RETENTION_SITE_ID is set. */
export function RetentionScript() {
  const siteId = resolveRetentionSiteId();
  if (!siteId) return null;

  const inline = `!function(){var geq=window.geq=window.geq||[];if(geq.initialize)return;if(geq.invoked){if(window.console&&console.error){console.error("Retention snippet included twice.")}return}geq.invoked=!0;geq.methods=["page","suppress","track","doNotTrack","trackOrder","identify","addToCart","callBack","event"];geq.factory=function(method){return function(){var args=Array.prototype.slice.call(arguments);args.unshift(method);geq.push(args);return geq}};for(var i=0;i<geq.methods.length;i++){var key=geq.methods[i];geq[key]=geq.factory(key)}geq.load=function(key){var script=document.createElement("script");script.type="text/javascript";script.async=!0;if(location.href.indexOf("vge=true")!==-1){script.src="https://s3-us-west-2.amazonaws.com/jsstore/a/"+key+"/ge.js?v="+Math.random()}else{script.src="https://s3-us-west-2.amazonaws.com/jsstore/a/"+key+"/ge.js"}var first=document.getElementsByTagName("script")[0];first.parentNode.insertBefore(script,first)};geq.SNIPPET_VERSION="1.6.1";geq.load(${JSON.stringify(siteId)})}();`;

  return (
    <Script
      id="retention-site-snippet"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: inline }}
    />
  );
}
