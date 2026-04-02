"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BadgeIcon, BasketIcon, CalendarIcon, ChevronDownIcon, ClockIcon, CopyIcon, GenderIcon, MapPinIcon, ShareIcon, ShoeIcon, UsersIcon } from "@/components/icons";
import { getParticipantSummary, getPriceLabel, REFUND_POLICY, type MatchRecord } from "@/lib/matches";
import styles from "./match-detail.module.css";

export function MatchDetail({ match }: { match: MatchRecord }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showApplyNotice, setShowApplyNotice] = useState(false);

  useEffect(() => {
    if (!copiedShare) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedShare(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedShare]);

  useEffect(() => {
    if (!copiedAddress) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedAddress(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedAddress]);

  useEffect(() => {
    if (!showApplyNotice) {
      return;
    }

    const timer = window.setTimeout(() => setShowApplyNotice(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showApplyNotice]);

  async function handleCopyShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
    } catch {
      setCopiedShare(false);
    }
  }

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(match.address);
      setCopiedAddress(true);
    } catch {
      setCopiedAddress(false);
    }
  }

  function showNextImage() {
    setImageIndex((current) => (current + 1) % match.imageUrls.length);
  }

  function showPrevImage() {
    setImageIndex((current) =>
      current === 0 ? match.imageUrls.length - 1 : current - 1,
    );
  }

  return (
    <main className={styles.page}>
      <div className={`pageShell ${styles.shell}`}>
        <header className={styles.header}>
          <Link className={styles.backLink} href="/">
            <ArrowLeftIcon className={styles.backIcon} />
            매치 리스트로 돌아가기
          </Link>
          <div className={styles.headerBadge}>AnkleBasket Match</div>
        </header>

        <section className={styles.gallerySection}>
          <div className={styles.galleryFrame}>
            <Image
              alt={match.venueName}
              className={styles.galleryImage}
              height={780}
              priority
              src={match.imageUrls[imageIndex]}
              width={1400}
            />
            <button className={styles.shareButton} onClick={handleCopyShare} type="button">
              <ShareIcon className={styles.buttonIcon} />
              {copiedShare ? "링크 복사 완료" : "친구에게 공유하기"}
            </button>
            <div className={styles.galleryActions}>
              <button aria-label="이전 이미지" className={styles.galleryNav} onClick={showPrevImage} type="button">
                <ArrowLeftIcon />
              </button>
              <button aria-label="다음 이미지" className={styles.galleryNav} onClick={showNextImage} type="button">
                <ArrowRightIcon />
              </button>
            </div>
          </div>

          <div className={styles.galleryThumbs}>
            {match.imageUrls.map((imageUrl, index) => (
              <button
                aria-label={`${index + 1}번째 이미지 보기`}
                className={`${styles.thumbButton} ${index === imageIndex ? styles.thumbButtonActive : ""}`}
                key={imageUrl}
                onClick={() => setImageIndex(index)}
                type="button"
              >
                <Image alt="" height={144} src={imageUrl} width={240} />
              </button>
            ))}
          </div>
        </section>

        <section className={styles.topInfo}>
          <div className={styles.detailCard}>
            <div className={styles.titleBlock}>
              <span className={styles.statusPill}>{match.status.label}</span>
              <h1>{match.title}</h1>
              <p>
                {match.dateLabel} · {match.venueName}
              </p>
            </div>

            <div className={styles.detailGrid}>
              <InfoCell icon={<BadgeIcon />} label="레벨 조건" value={match.levelCondition} />
              <InfoCell icon={<GenderIcon />} label="성별 조건" value={match.genderCondition} />
              <InfoCell icon={<ClockIcon />} label="경기 시간" value={match.durationText} />
              <InfoCell icon={<BasketIcon />} label="경기 방식" value={match.format} />
              <InfoCell icon={<UsersIcon />} label="인원" value={`최대 ${match.capacity}명`} />
              <InfoCell icon={<ShoeIcon />} label="준비물" value={match.preparation} />
            </div>
          </div>

          <aside className={styles.applyCard}>
            <div className={styles.applyTop}>
              <span className="sectionLabel">
                <CalendarIcon />
                신청 정보
              </span>
              <h2>
                {match.dateLabel} · {match.time}
              </h2>
              <strong>{match.venueName}</strong>
              <div className={styles.addressRow}>
                <p>{match.address}</p>
                <button className={styles.copyButton} onClick={handleCopyAddress} type="button">
                  <CopyIcon className={styles.buttonIcon} />
                  {copiedAddress ? "복사 완료" : "주소 복사"}
                </button>
              </div>
            </div>

            <div className={styles.applyDivider} />

            <div className={styles.priceRow}>
              <span>참가 금액</span>
              <strong>{getPriceLabel(match.price)}</strong>
            </div>
            <div className={styles.participantRow}>{getParticipantSummary(match)}</div>

            <button className={styles.applyButton} onClick={() => setShowApplyNotice(true)} type="button">
              신청하기
            </button>
            <p className={styles.applyHint}>로그인, 결제, 신청 저장은 다음 단계에서 연결합니다.</p>
            {showApplyNotice ? (
              <div className={styles.applyNotice}>다음 단계에서는 로그인 확인 후 결제 플로우로 연결됩니다.</div>
            ) : null}
          </aside>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
            <section className={styles.infoPanel}>
              <div className={styles.panelHeader}>
                <span className="sectionLabel">
                  <UsersIcon />
                  매치 데이터
                </span>
                <h2>신청자 레벨 분포</h2>
              </div>

              <div className={styles.distributionBar}>
                {match.levelDistribution.map((entry) => (
                  <div
                    className={`${styles.distributionSegment} ${
                      entry.tone === "basic"
                        ? styles.segmentBasic
                        : entry.tone === "middle"
                          ? styles.segmentMiddle
                          : styles.segmentHigh
                    }`}
                    key={entry.label}
                    style={{ width: `${entry.value}%` }}
                  />
                ))}
              </div>

              <div className={styles.distributionLegend}>
                {match.levelDistribution.map((entry) => (
                  <div className={styles.legendRow} key={entry.label}>
                    <span>{entry.label}</span>
                    <strong>{entry.value}%</strong>
                  </div>
                ))}
              </div>
              <p className={styles.averageNote}>{match.averageLevel}</p>
            </section>

            <section className={styles.infoPanel}>
              <div className={styles.panelHeader}>
                <span className="sectionLabel">
                  <MapPinIcon />
                  구장 정보
                </span>
                <h2>찾아오기 전에 확인해 주세요</h2>
              </div>
              <div className={styles.venueInfoGrid}>
                <VenueInfo label="찾아오는 길" value={match.venueInfo.directions} />
                <VenueInfo label="주차" value={match.venueInfo.parking} />
                <VenueInfo label="흡연" value={match.venueInfo.smoking} />
                <VenueInfo label="샤워실 · 락커" value={match.venueInfo.showerLocker} />
              </div>
            </section>

            <details className={styles.accordion} open>
              <summary>
                <span>매치 진행 방식</span>
                <ChevronDownIcon className={styles.chevronIcon} />
              </summary>
              <ul className={styles.detailList}>
                {match.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </details>

            <details className={styles.accordion}>
              <summary>
                <span>안전 유의사항</span>
                <ChevronDownIcon className={styles.chevronIcon} />
              </summary>
              <ul className={styles.detailList}>
                {match.safetyNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>

            <details className={styles.accordion}>
              <summary>
                <span>환불 정책</span>
                <ChevronDownIcon className={styles.chevronIcon} />
              </summary>
              <div className={styles.policyTable}>
                {REFUND_POLICY.map((item) => (
                  <div className={styles.policyRow} key={item.point}>
                    <span>{item.point}</span>
                    <strong>{item.detail}</strong>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.infoCell}>
      <div className={styles.infoIcon}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function VenueInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.venueInfoCard}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

