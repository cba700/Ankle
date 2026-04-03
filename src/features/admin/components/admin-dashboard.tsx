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
          <h2 className={styles.heroTitle}>관리 경기장을 먼저 정리하고 그 값을 기준으로 매치를 여는 단계</h2>
          <p className={styles.heroDescription}>
            경기장 기본값을 미리 저장해 두고, 새 매치를 열 때 필요한 정보를 한 번에 채운 뒤
            회차별로만 조정하는 운영 흐름에 맞춰 화면을 구성했습니다.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link className={styles.secondaryLink} href="/admin/venues">
            경기장 관리
          </Link>
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
            <li>자주 쓰는 경기장의 기본 안내와 규칙을 먼저 최신화</li>
            <li>임시 저장 상태 회차의 카피와 가격만 빠르게 입력</li>
            <li>마감 임박 회차의 공지 문구와 취소 대응 재검토</li>
          </ul>
        </section>

        <section className={styles.noteCard}>
          <p className={styles.noteLabel}>입력 원칙</p>
          <h3 className={styles.noteTitle}>경기장 원본과 매치 저장값을 분리합니다</h3>
          <ul className={styles.noteList}>
            <li>관리 경기장은 새 매치의 기본값 공급원으로만 사용</li>
            <li>매치에서 수정한 내용은 해당 회차에만 반영</li>
            <li>새 경기장은 매치 저장과 함께 관리 경기장에도 자동 등록</li>
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
