import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Dev tools | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }) {
  return children;
}
