import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Compilations opted out | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function OptedOutCompsLayout({ children }) {
  return children;
}
