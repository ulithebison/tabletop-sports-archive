import type { Metadata } from "next";

// Submission forms have no search value. Keep them out of the index,
// but let crawlers follow their links.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
