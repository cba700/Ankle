import { AppLink } from "@/components/navigation/app-link";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { AdminShell } from "@/features/admin/components/admin-shell";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminMatches } from "@/features/admin/data";
import { buildAdminMatchRows, buildAdminOverviewCards } from "@/features/admin/view-model";

export default async function AdminPage() {
  const matches = await getAdminMatches();
  const overviewCards = buildAdminOverviewCards(matches);
  const recentMatches = buildAdminMatchRows(matches).slice(0, 3);

  return (
    <AdminShell
      activeNav="dashboard"
      actions={
        <>
          <AppLink className={ui.button} href="/admin/cash">
            캐시 현황
          </AppLink>
          <AppLink className={ui.button} href="/admin/coupons">
            쿠폰 관리
          </AppLink>
          <AppLink className={ui.button} href="/admin/banners">
            배너 관리
          </AppLink>
          <AppLink className={ui.button} href="/admin/venues">
            경기장 관리
          </AppLink>
          <AppLink className={`${ui.button} ${ui.buttonBrand}`} href="/admin/matches/new">
            + 새 매치
          </AppLink>
          <AppLink className={ui.button} href="/admin/matches">
            전체 일정
          </AppLink>
        </>
      }
      eyebrow="DASHBOARD"
      title="운영 현황"
    >
      <AdminDashboard cards={overviewCards} recentMatches={recentMatches} />
    </AdminShell>
  );
}
