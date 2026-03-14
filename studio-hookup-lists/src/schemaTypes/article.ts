import { defineField, defineType } from "sanity";

export const articleType = defineType({
  name: "article",
  type: "document",
  title: "Article",
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "kicker", type: "string", title: "Kicker" }),
    defineField({ name: "subtitle", type: "string", title: "Subtitle" }),
    defineField({ name: "summary", type: "text", title: "Summary" }),
    defineField({
      name: "mainImage",
      type: "image",
      title: "Main image",
      options: { hotspot: true },
    }),
    defineField({ name: "photoCredit", type: "string", title: "Photo credit" }),
    defineField({ name: "brandExplainer", type: "text", title: "Brand explainer" }),
    defineField({ name: "publishedDate", type: "datetime", title: "Published date" }),
    defineField({
      name: "entries",
      type: "array",
      title: "Entries",
      of: [{ type: "articleEntry" }],
    }),
    defineField({ name: "disclaimer", type: "text", title: "Disclaimer" }),
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare({ title, slug }) {
      return { title: title || slug || "Untitled" };
    },
  },
});
