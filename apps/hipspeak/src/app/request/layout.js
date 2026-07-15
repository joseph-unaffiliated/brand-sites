import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Request | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function RequestLayout({ children }) {
  return children;
}
