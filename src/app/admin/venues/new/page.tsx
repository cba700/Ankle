import { createAdminVenueAction } from "@/features/admin/actions";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminVenueEditor } from "@/features/admin/components/admin-venue-editor";
import { buildAdminVenueFormValue } from "@/features/admin/view-model";

export default function AdminNewVenuePage() {
  return (
    <AdminShell
      activeNav="venues"
      description="매치 생성 전에 자주 쓰는 경기장을 먼저 등록해 두면 다음부터 한 번에 불러올 수 있습니다."
      eyebrow="Create Venue"
      title="새 경기장 등록"
    >
      <AdminVenueEditor
        formAction={createAdminVenueAction}
        mode="create"
        values={buildAdminVenueFormValue()}
      />
    </AdminShell>
  );
}
