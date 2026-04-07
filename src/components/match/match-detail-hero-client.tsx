"use client";

import { useState } from "react";
import { MatchHero } from "./match-hero";
import { useMatchDetailFeedback } from "./match-detail-feedback";

type MatchDetailHeroClientProps = {
  courtName: string;
  images: string[];
};

export function MatchDetailHeroClient({
  courtName,
  images,
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
      imageIndex={imageIndex}
      images={images}
      onCopyShare={handleCopyShare}
      onNext={handleNextImage}
      onPrev={handlePrevImage}
    />
  );
}
