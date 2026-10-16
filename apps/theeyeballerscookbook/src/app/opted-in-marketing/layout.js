import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Marketing emails restored | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function OptedInMarketingLayout({ children }) {
  return children;
}
