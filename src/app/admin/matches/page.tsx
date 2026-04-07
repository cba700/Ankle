import { AppLink } from "@/components/navigation/app-link";
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
      title="매치 운영 리스트"
    >
      <AdminMatchList rows={rows} variant="matches" />
    </AdminShell>
  );
}
