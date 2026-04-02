import { AdminMatchList } from "@/features/admin/components/admin-match-list";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminMatches } from "@/features/admin/mock/admin-matches";
import { buildAdminMatchRows } from "@/features/admin/view-model";

export default function AdminMatchesPage() {
  const rows = buildAdminMatchRows(getAdminMatches());

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
        description="목업 데이터로 구성된 관리자 전용 일정입니다. 공개 홈/상세에는 아직 연결되지 않습니다."
        heading="전체 운영 회차"
        rows={rows}
      />
    </AdminShell>
  );
}
