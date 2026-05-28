/**
 * Legacy stub — production schema is studio-the-pickle-report/schemaTypes/article.ts
 */
export default {
  name: "article",
  type: "document",
  title: "Article",
  fields: [
    { name: "slug", type: "slug", title: "Slug", options: { source: "title" }, validation: (Rule) => Rule.required() },
    { name: "title", type: "string", title: "Title", validation: (Rule) => Rule.required() },
    { name: "subtitle", type: "string", title: "Subtitle" },
    { name: "summary", type: "text", title: "Summary" },
    { name: "mainImage", type: "image", title: "Main image", options: { hotspot: true } },
    { name: "photoCredit", type: "string", title: "Photo credit" },
    { name: "publishedDate", type: "datetime", title: "Publishing date" },
    { name: "authorName", type: "string", title: "Author" },
    { name: "disclaimer", type: "text", title: "Disclaimer" },
    { name: "contentBlocks", type: "array", title: "Issue sections", of: [{ type: "object" }] },
  ],
};
