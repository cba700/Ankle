import { notFound } from "next/navigation";
import { updateAdminMatchAction } from "@/features/admin/actions";
import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminMatchById, getAdminVenueOptions } from "@/features/admin/data";
import { buildAdminMatchFormValue } from "@/features/admin/view-model";

export default async function AdminEditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getAdminMatchById(id);
  const venueOptions = await getAdminVenueOptions();
  const formAction = updateAdminMatchAction.bind(null, id);

  if (!match) {
    notFound();
  }

  return (
    <AdminShell
      activeNav="matches"
      description="이 회차의 운영 메시지와 경기장 스냅샷을 수정해도 관리 경기장 원본은 바뀌지 않습니다."
      eyebrow="Edit Match"
      title={match.title}
    >
      <AdminMatchEditor
        formAction={formAction}
        mode="edit"
        values={buildAdminMatchFormValue(match)}
        venueOptions={venueOptions}
      />
    </AdminShell>
  );
}
