import { notFound } from "next/navigation";
import { updateAdminVenueAction } from "@/features/admin/actions";
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
        formAction={formAction}
        mode="edit"
        values={buildAdminVenueFormValue(venue)}
      />
    </AdminShell>
  );
}
