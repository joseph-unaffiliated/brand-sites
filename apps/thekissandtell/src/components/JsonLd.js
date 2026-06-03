/**
 * Server-rendered JSON-LD helper.
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
