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
      <AdminOverviewCards items={cards} />
      <AdminMatchList rows={recentMatches} title="최근 운영 매치" variant="dashboard" />
    </div>
  );
}
