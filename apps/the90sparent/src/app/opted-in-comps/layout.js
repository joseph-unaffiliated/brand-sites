import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Compilations restored | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function OptedInCompsLayout({ children }) {
  return children;
}
