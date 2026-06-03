import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Check your inbox | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function RequestLayout({ children }) {
  return children;
}
