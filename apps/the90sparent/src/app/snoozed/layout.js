import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Snoozed | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function SnoozedLayout({ children }) {
  return children;
}
