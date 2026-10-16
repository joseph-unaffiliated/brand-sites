import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Marketing emails opted out | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function OptedOutMarketingLayout({ children }) {
  return children;
}
