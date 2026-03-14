import { defineField, defineType } from "sanity";

export const articleEntryType = defineType({
  name: "articleEntry",
  type: "object",
  title: "Article entry",
  fields: [
    defineField({ name: "age", type: "string", title: "Age" }),
    defineField({ name: "title", type: "string", title: "Title" }),
    defineField({ name: "body", type: "text", title: "Body" }),
  ],
});
