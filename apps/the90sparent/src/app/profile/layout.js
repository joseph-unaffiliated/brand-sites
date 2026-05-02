import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Profile | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }) {
  return children;
}
