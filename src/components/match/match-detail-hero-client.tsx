"use client";

import { useEffect, useState } from "react";
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
  const hasMultipleImages = images.length > 1;
  const [trackIndex, setTrackIndex] = useState(hasMultipleImages ? 1 : 0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(hasMultipleImages);

  useEffect(() => {
    setTrackIndex(images.length > 1 ? 1 : 0);
    setIsTransitionEnabled(images.length > 1);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsTransitionEnabled(true);
      setTrackIndex((current) => current + 1);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [images.length, trackIndex]);

  useEffect(() => {
    if (isTransitionEnabled || images.length <= 1) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [images.length, isTransitionEnabled]);

  const imageIndex =
    images.length <= 1 ? 0 : (trackIndex - 1 + images.length) % images.length;

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

    setIsTransitionEnabled(true);
    setTrackIndex((current) => current - 1);
  }

  function handleNextImage() {
    if (images.length <= 1) {
      return;
    }

    setIsTransitionEnabled(true);
    setTrackIndex((current) => current + 1);
  }

  function handleTrackTransitionEnd() {
    if (images.length <= 1) {
      return;
    }

    if (trackIndex === 0) {
      setIsTransitionEnabled(false);
      setTrackIndex(images.length);
      return;
    }

    if (trackIndex === images.length + 1) {
      setIsTransitionEnabled(false);
      setTrackIndex(1);
    }
  }

  return (
    <MatchHero
      courtName={courtName}
      dateText={dateText}
      imageIndex={imageIndex}
      images={images}
      isTransitionEnabled={isTransitionEnabled}
      onCopyShare={handleCopyShare}
      onNext={handleNextImage}
      onPrev={handlePrevImage}
      onTrackTransitionEnd={handleTrackTransitionEnd}
      statusLabel={statusLabel}
      statusTone={statusTone}
      trackIndex={trackIndex}
      time={time}
      title={title}
    />
  );
}
