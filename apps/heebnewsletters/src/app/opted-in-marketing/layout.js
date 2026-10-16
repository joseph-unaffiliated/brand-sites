import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Ok, you're back in | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function OptedInMarketingLayout({ children }) {
  return children;
}
