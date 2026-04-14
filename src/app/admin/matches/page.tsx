import { AppLink } from "@/components/navigation/app-link";
import { updateAdminPlayerLevelAction } from "@/features/admin/actions";
import { AdminMatchList } from "@/features/admin/components/admin-match-list";
import { AdminShell } from "@/features/admin/components/admin-shell";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminMatches } from "@/features/admin/data";
import { buildAdminMatchRows } from "@/features/admin/view-model";

export default async function AdminMatchesPage() {
  const rows = buildAdminMatchRows(await getAdminMatches());

  return (
    <AdminShell
      activeNav="matches"
      actions={
        <AppLink className={`${ui.button} ${ui.buttonBrand}`} href="/admin/matches/new">
          + 새 매치 만들기
        </AppLink>
      }
      eyebrow="MATCHES"
      description="가까운 일정과 참가자 현황을 빠르게 확인하고, 참가자 레벨까지 바로 조정합니다."
      title="매치 운영 리스트"
    >
      <AdminMatchList
        onUpdatePlayerLevel={updateAdminPlayerLevelAction}
        rows={rows}
        variant="matches"
      />
    </AdminShell>
  );
}
