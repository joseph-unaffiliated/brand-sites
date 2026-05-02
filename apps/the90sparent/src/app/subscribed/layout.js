import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Subscribed | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function SubscribedLayout({ children }) {
  return children;
}
