export default {
  name: "article",
  type: "document",
  title: "Article",
  fields: [
    { name: "slug", type: "slug", title: "Slug", options: { source: "title" }, validation: (Rule) => Rule.required() },
    { name: "title", type: "string", title: "Title", validation: (Rule) => Rule.required() },
    { name: "kicker", type: "string", title: "Kicker" },
    { name: "subtitle", type: "string", title: "Subtitle" },
    { name: "summary", type: "text", title: "Summary" },
    {
      name: "mainImage",
      type: "image",
      title: "Main image",
      options: { hotspot: true },
    },
    { name: "photoCredit", type: "string", title: "Photo credit" },
    { name: "brandExplainer", type: "text", title: "Brand explainer" },
    { name: "publishedDate", type: "datetime", title: "Published date" },
    {
      name: "entries",
      type: "array",
      title: "Entries",
      of: [{ type: "articleEntry" }],
    },
    { name: "disclaimer", type: "text", title: "Disclaimer" },
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare({ title, slug }) {
      return { title: title || slug || "Untitled" };
    },
  },
};
