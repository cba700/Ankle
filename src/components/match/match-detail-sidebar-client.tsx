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

  function handleReserve() {
    showToast("자리 맡기 기능은 운영 플로우 연결 전 단계입니다.", "default");
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
      likes={view.likes}
      mapUrl={view.mapUrl}
      notice={view.notice}
      onCopyAddress={handleCopyAddress}
      onOpenCancelInfo={() =>
        showToast("취소 걱정 안내는 다음 단계에서 별도 정책 화면과 연결됩니다.", "default")
      }
      onOpenFaq={() =>
        showToast("매치 전 안내 FAQ는 다음 단계에서 연결됩니다.", "default")
      }
      onReserve={handleReserve}
      onSave={handleSave}
      priceLabel={view.priceLabel}
      saved={saved}
      time={view.time}
      views={view.views}
    />
  );
}
