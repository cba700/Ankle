"use client";

import { useState } from "react";
import { MatchHero } from "./match-hero";
import { useMatchDetailFeedback } from "./match-detail-feedback";

type MatchDetailHeroClientProps = {
  courtName: string;
  dateText: string;
  images: string[];
  statusLabel: string;
  statusTone: "neutral" | "accent" | "danger" | "open";
  time: string;
  title: string;
};

export function MatchDetailHeroClient({
  courtName,
  dateText,
  images,
  statusLabel,
  statusTone,
  time,
  title,
}: MatchDetailHeroClientProps) {
  const showToast = useMatchDetailFeedback();
  const [imageIndex, setImageIndex] = useState(0);

  async function handleCopyShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("페이지 링크를 복사했어요.", "success");
    } catch {
      showToast("복사에 실패했습니다. 다시 시도해 주세요.", "accent");
    }
  }

  function handlePrevImage() {
    if (images.length <= 1) {
      return;
    }

    setImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function handleNextImage() {
    if (images.length <= 1) {
      return;
    }

    setImageIndex((current) => (current + 1) % images.length);
  }

  return (
    <MatchHero
      courtName={courtName}
      dateText={dateText}
      imageIndex={imageIndex}
      images={images}
      onCopyShare={handleCopyShare}
      onNext={handleNextImage}
      onPrev={handlePrevImage}
      statusLabel={statusLabel}
      statusTone={statusTone}
      time={time}
      title={title}
    />
  );
}
