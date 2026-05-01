import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Redirecting | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function RedirectLayout({ children }) {
  return children;
}
