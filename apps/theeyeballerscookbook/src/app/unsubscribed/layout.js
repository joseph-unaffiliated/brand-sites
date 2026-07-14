import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Unsubscribed | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function UnsubscribedLayout({ children }) {
  return children;
}
