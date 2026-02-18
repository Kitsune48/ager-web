"use client";

import FeedTabs from "@/features/feed/components/FeedTabs";
import FeedList from "@/features/feed/components/FeedList";

export default function FeedPageClient() {
  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-0">
      <FeedTabs />
      <FeedList />
    </div>
  );
}
