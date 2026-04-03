import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminVenueList } from "@/features/admin/components/admin-venue-list";
import { getAdminVenues } from "@/features/admin/data";
import { buildAdminVenueRows } from "@/features/admin/view-model";

export default async function AdminVenuesPage() {
  const rows = buildAdminVenueRows(await getAdminVenues());

  return (
    <AdminShell
      activeNav="venues"
      description="관리 중인 경기장의 기본 안내, 이미지, 규칙, 안전 메모를 먼저 정리해 두는 화면입니다."
      eyebrow="Venues"
      title="경기장 관리"
    >
      <AdminVenueList
        description="여기서 정리한 값은 새 매치를 만들 때 기본값으로 바로 불러올 수 있습니다."
        heading="관리 경기장 목록"
        rows={rows}
      />
    </AdminShell>
  );
}
