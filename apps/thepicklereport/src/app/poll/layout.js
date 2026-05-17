import { siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Vote | ${siteDisplayName}`,
  robots: { index: false, follow: false },
};

export default function PollLayout({ children }) {
  return children;
}
