/**
 * Server-rendered JSON-LD helper. Renders structured data inside a
 * `<script type="application/ld+json">` tag so search engines and AI
 * answer engines can ingest it.
 *
 * Pass a JS object (or an array of objects) via the `data` prop.
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
