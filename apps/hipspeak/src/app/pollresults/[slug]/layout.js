import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: siteDisplayName,
  robots: { index: false, follow: false },
};

export default function PollResultsLayout({ children }) {
  return children;
}
