import { AdminMatchList } from "@/features/admin/components/admin-match-list";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminMatches } from "@/features/admin/data";
import { buildAdminMatchRows } from "@/features/admin/view-model";

export default async function AdminMatchesPage() {
  const rows = buildAdminMatchRows(await getAdminMatches());

  return (
    <AdminShell
      activeNav="matches"
      description="운영 회차를 상태, 일정, 참가 현황 중심으로 훑고 바로 수정 화면으로 들어갈 수 있게 구성했습니다."
      eyebrow="Matches"
      title="매치 운영 리스트"
    >
      <AdminMatchList
        ctaHref="/admin/matches/new"
        ctaLabel="새 매치 만들기"
        description="경기장 기본값을 불러와 생성한 운영 회차를 상태와 일정 중심으로 관리합니다."
        heading="전체 운영 회차"
        rows={rows}
      />
    </AdminShell>
  );
}
