import { Suspense } from "react";
import FeedPageClient from "./FeedPageClient";

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedPageClient />
    </Suspense>
  );
}
