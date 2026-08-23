import { Suspense } from "react";
import { siteDisplayName } from "@/config/site";
import SlangQuizClient from "./SlangQuizClient";

export const metadata = {
  title: `Slang quiz | ${siteDisplayName}`,
  description: "Test your Gen Z / Alpha slang knowledge — then unlock your score.",
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: `Slang quiz | ${siteDisplayName}`,
    description: "Test your Gen Z / Alpha slang knowledge — then unlock your score.",
    url: "/quiz",
    type: "website",
  },
};

export default function QuizPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem 1.5rem" }}>Loading…</div>}>
      <SlangQuizClient />
    </Suspense>
  );
}
