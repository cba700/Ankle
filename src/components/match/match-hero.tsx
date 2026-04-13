import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon, ShareIcon } from "@/components/icons";
import styles from "./match-hero.module.css";

type MatchHeroProps = {
  dateText: string;
  courtName: string;
  images: string[];
  imageIndex: number;
  isTransitionEnabled: boolean;
  statusLabel: string;
  statusTone: "neutral" | "accent" | "danger" | "open";
  time: string;
  trackIndex: number;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onCopyShare: () => void;
  onTrackTransitionEnd: () => void;
};

export function MatchHero({
  dateText,
  courtName,
  images,
  imageIndex,
  isTransitionEnabled,
  statusLabel,
  statusTone,
  time,
  trackIndex,
  title,
  onPrev,
  onNext,
  onCopyShare,
  onTrackTransitionEnd,
}: MatchHeroProps) {
  const hasImages = images.length > 0;
  const showControls = images.length > 1;
  const trackImages =
    images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images;

  return (
    <section className={styles.hero}>
      <div className={styles.frame}>
        {hasImages ? (
          <div className={styles.imageViewport}>
            <div
              className={styles.imageTrack}
              onTransitionEnd={onTrackTransitionEnd}
              style={{
                transform: `translateX(-${trackIndex * 100}%)`,
                transitionDuration: isTransitionEnabled ? undefined : "0ms",
              }}
            >
              {trackImages.map((imageSrc, index) => (
                <div
                  aria-hidden={index !== trackIndex}
                  className={styles.imageSlide}
                  key={`${imageSrc}-${index}`}
                >
                  <Image
                    alt={courtName}
                    className={styles.image}
                    fill
                    priority={index === 1 || trackImages.length === 1}
                    sizes="(max-width: 1080px) 100vw, 1050px"
                    src={imageSrc}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderCopy}>
              <span className={styles.placeholderEyebrow}>Court Preview</span>
              <strong>{courtName}</strong>
              <span>코트 이미지를 연결하면 이 영역에 노출됩니다.</span>
            </div>
            <div className={styles.courtLines} />
          </div>
        )}

        <button className={styles.shareButton} onClick={onCopyShare} type="button">
          <ShareIcon className={styles.shareIcon} />
          친구에게 공유하기
        </button>

        <div className={styles.heroCopy}>
          <span
            className={`${styles.statusPill} ${
              statusTone === "danger"
                ? styles.statusDanger
                : statusTone === "accent"
                  ? styles.statusAccent
                  : statusTone === "open"
                    ? styles.statusOpen
                    : styles.statusNeutral
            }`}
          >
            {statusLabel}
          </span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subTitle}>
            {dateText} {time} · {courtName}
          </p>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.counter}>
            {hasImages ? `${imageIndex + 1} / ${images.length}` : "코트 미리보기"}
          </div>
          {showControls ? (
            <div className={styles.controls}>
              <button aria-label="이전 이미지" className={styles.controlButton} onClick={onPrev} type="button">
                <ArrowLeftIcon className={styles.controlIcon} />
              </button>
              <button aria-label="다음 이미지" className={styles.controlButton} onClick={onNext} type="button">
                <ArrowRightIcon className={styles.controlIcon} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
