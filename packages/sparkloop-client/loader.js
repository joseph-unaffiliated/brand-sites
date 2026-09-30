/**
 * Loads the SparkLoop embed in Client API mode (no managed widget) and resolves with `SL.client`.
 * Docs: https://docs.sparkloop.app/client-api/getting-started
 */

const EMBED_SRC = "https://js.sparkloop.app/embed.js";

let readyPromise = null;

function readyClient() {
  if (typeof window === "undefined") return null;
  const client = window.SL?.client;
  return client?.recommendations ? client : null;
}

/**
 * Test mode is on unless the env value is exactly "false" — calls without it count as real traffic.
 * @param {string|undefined} envValue
 */
export function resolveSparkloopTestMode(envValue) {
  return String(envValue ?? "").trim().toLowerCase() !== "false";
}

/**
 * @param {{ publicationId: string, testMode?: boolean, timeoutMs?: number }} opts
 * @returns {Promise<any>} SparkLoop `SL.client`
 */
export function loadSparkloopClient({ publicationId, testMode = true, timeoutMs = 6000 }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SparkLoop client requires a browser"));
  }
  if (!publicationId) {
    return Promise.reject(new Error("Missing SparkLoop publication id"));
  }

  const existing = readyClient();
  if (existing) return Promise.resolve(existing);
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("SparkLoop did not become ready"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("sl:ready", onReady);
    }

    function onReady() {
      cleanup();
      const client = readyClient();
      if (client) resolve(client);
      else reject(new Error("SparkLoop ready without SL.client"));
    }

    document.addEventListener("sl:ready", onReady);

    const config = { ...(window.SL || {}), mode: "client" };
    if (testMode) config.test_mode = true;
    else delete config.test_mode;
    window.SL = config;

    if (!document.querySelector("script[data-sparkloop]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `${EMBED_SRC}?publication_id=${encodeURIComponent(publicationId)}`;
      script.setAttribute("data-sparkloop", "");
      script.onerror = () => {
        cleanup();
        reject(new Error("SparkLoop script failed to load"));
      };
      document.head.appendChild(script);
    }
  }).catch((err) => {
    readyPromise = null;
    throw err;
  });

  return readyPromise;
}
