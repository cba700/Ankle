import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminMatches } from "@/features/admin/mock/admin-matches";
import { buildAdminMatchRows, buildAdminOverviewCards } from "@/features/admin/view-model";

export default function AdminPage() {
  const matches = getAdminMatches();
  const overviewCards = buildAdminOverviewCards(matches);
  const recentMatches = buildAdminMatchRows(matches).slice(0, 3);

  return (
    <AdminShell
      activeNav="dashboard"
      description="기존 메인과 상세 흐름은 유지한 채, 운영자가 매치를 열고 다듬는 백오피스 표면만 먼저 검증합니다."
      eyebrow="Admin Dashboard"
      title="운영 흐름을 먼저 정리하는 관리자 홈"
    >
      <AdminDashboard cards={overviewCards} recentMatches={recentMatches} />
    </AdminShell>
  );
}
