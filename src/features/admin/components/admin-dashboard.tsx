import Link from "next/link";
import type { AdminMatchRow, AdminOverviewCard } from "../types";
import { AdminMatchList } from "./admin-match-list";
import { AdminOverviewCards } from "./admin-overview-cards";
import styles from "./admin-dashboard.module.css";

type AdminDashboardProps = {
  cards: AdminOverviewCard[];
  recentMatches: AdminMatchRow[];
};

export function AdminDashboard({
  cards,
  recentMatches,
}: AdminDashboardProps) {
  return (
    <div className={styles.layout}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroLabel}>오늘 운영 포인트</p>
          <h2 className={styles.heroTitle}>공개 화면은 그대로 두고 운영 흐름만 먼저 다듬는 단계</h2>
          <p className={styles.heroDescription}>
            새 매치를 열고, 기존 회차 상태를 정리하고, 마감 임박 회차를 빠르게 점검하는
            백오피스 리듬에 맞춰 화면을 구성했습니다.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link className={styles.primaryLink} href="/admin/matches/new">
            새 매치 열기
          </Link>
          <Link className={styles.secondaryLink} href="/admin/matches">
            전체 일정 보기
          </Link>
        </div>
      </section>

      <AdminOverviewCards items={cards} />

      <div className={styles.noteGrid}>
        <section className={styles.noteCard}>
          <p className={styles.noteLabel}>운영 루틴</p>
          <h3 className={styles.noteTitle}>오늘 먼저 확인할 것</h3>
          <ul className={styles.noteList}>
            <li>임시 저장 상태인 회차의 카피와 이미지 확정</li>
            <li>마감 임박 회차의 공지 문구와 취소 규정 재검토</li>
            <li>기상 변수 있는 코트는 2차 운영 공지 준비</li>
          </ul>
        </section>

        <section className={styles.noteCard}>
          <p className={styles.noteLabel}>목업 원칙</p>
          <h3 className={styles.noteTitle}>현재 공개 페이지와 분리되어 있습니다</h3>
          <ul className={styles.noteList}>
            <li>메인과 상세가 읽는 데이터 소스는 건드리지 않음</li>
            <li>운영자 UI, 목업 타입, 스타일 모두 전용 경로에 격리</li>
            <li>실저장 연결은 후속 단계로 분리</li>
          </ul>
        </section>
      </div>

      <AdminMatchList
        compact
        ctaHref="/admin/matches"
        ctaLabel="전체 회차 보기"
        description="이번 주 운영 회차 중 최근 일정만 먼저 추려서 보여줍니다."
        heading="최근 운영 매치"
        rows={recentMatches}
      />
    </div>
  );
}
