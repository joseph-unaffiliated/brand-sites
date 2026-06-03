import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemas";

export default defineConfig({
  name: "hardresets",
  title: "Hard Resets CMS",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "0vm5rx64",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
