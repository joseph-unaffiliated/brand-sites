import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Poll | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function PollLayout({ children }) {
  return children;
}
