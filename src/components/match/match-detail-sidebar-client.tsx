"use client";

import { useState } from "react";
import type { MatchDetailViewModel } from "./match-detail-types";
import { useMatchDetailFeedback } from "./match-detail-feedback";
import { MatchSidebar } from "./match-sidebar";

type MatchDetailSidebarClientProps = {
  applyHref: string;
  canApply: boolean;
  view: MatchDetailViewModel;
};

export function MatchDetailSidebarClient({
  applyHref,
  canApply,
  view,
}: MatchDetailSidebarClientProps) {
  const showToast = useMatchDetailFeedback();
  const [saved, setSaved] = useState(false);

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(view.address);
      showToast("주소를 복사했어요.", "success");
    } catch {
      showToast("복사에 실패했습니다. 다시 시도해 주세요.", "accent");
    }
  }

  function handleSave() {
    setSaved((current) => {
      const next = !current;
      showToast(
        next ? "관심 매치에 추가했어요." : "관심 매치에서 제거했어요.",
        "success",
      );
      return next;
    });
  }

  return (
    <MatchSidebar
      address={view.address}
      applyHref={applyHref}
      canApply={canApply}
      courtName={view.courtName}
      dateText={view.dateText}
      mapUrl={view.mapUrl}
      onCopyAddress={handleCopyAddress}
      onSave={handleSave}
      priceLabel={view.priceLabel}
      saved={saved}
      time={view.time}
    />
  );
}
