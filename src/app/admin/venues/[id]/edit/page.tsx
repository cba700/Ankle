import { notFound } from "next/navigation";
import {
  deleteAdminVenueAction,
  updateAdminVenueAction,
} from "@/features/admin/actions";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminVenueEditor } from "@/features/admin/components/admin-venue-editor";
import { getAdminVenueById } from "@/features/admin/data";
import { buildAdminVenueFormValue } from "@/features/admin/view-model";

export default async function AdminEditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await getAdminVenueById(id);
  const formAction = updateAdminVenueAction.bind(null, id);
  const deleteAction = deleteAdminVenueAction.bind(null, id);

  if (!venue) {
    notFound();
  }

  return (
    <AdminShell
      activeNav="venues"
      description="이 경기장의 기본값은 이후 새 매치 생성 시 바로 불러오는 템플릿으로 사용됩니다."
      eyebrow="Edit Venue"
      title={venue.name}
    >
      <AdminVenueEditor
        canDelete={venue.matchCount === 0}
        deleteAction={deleteAction}
        deleteConfirmMessage="이 경기장을 삭제할까요? 연결된 매치가 없는 경우에만 삭제되며, 삭제 후 되돌릴 수 없습니다."
        deleteDisabledReason="이 경기장으로 생성된 매치가 있어 삭제할 수 없습니다. 비활성화로 보관해 주세요."
        formAction={formAction}
        mode="edit"
        values={buildAdminVenueFormValue(venue)}
      />
    </AdminShell>
  );
}
