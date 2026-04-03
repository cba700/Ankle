import { notFound } from "next/navigation";
import { updateAdminMatchAction } from "@/features/admin/actions";
import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminMatchById } from "@/features/admin/data";
import { buildAdminMatchFormValue } from "@/features/admin/view-model";

export default async function AdminEditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getAdminMatchById(id);
  const formAction = updateAdminMatchAction.bind(null, id);

  if (!match) {
    notFound();
  }

  return (
    <AdminShell
      activeNav="matches"
      description="기존 공개 페이지와 분리된 관리자 목업이므로, 운영 메시지와 회차 상태를 안전하게 다듬을 수 있습니다."
      eyebrow="Edit Match"
      title={match.title}
    >
      <AdminMatchEditor
        formAction={formAction}
        mode="edit"
        values={buildAdminMatchFormValue(match)}
      />
    </AdminShell>
  );
}
