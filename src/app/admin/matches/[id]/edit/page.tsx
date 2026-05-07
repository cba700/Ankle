import { notFound } from "next/navigation";
import {
  cancelAdminMatchForRainAction,
  deleteAdminMatchAction,
  sendAdminMatchRainAlertAction,
  setAdminMatchRefundExceptionAction,
  updateAdminMatchAction,
} from "@/features/admin/actions";
import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminMatchRainPanel } from "@/features/admin/components/admin-match-rain-panel";
import { AdminShell } from "@/features/admin/components/admin-shell";
import {
  getAdminMatchApplicationCount,
  getAdminMatchById,
  getAdminVenueOptions,
} from "@/features/admin/data";
import { buildAdminMatchFormValue } from "@/features/admin/view-model";

export default async function AdminEditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, venueOptions, applicationCount] = await Promise.all([
    getAdminMatchById(id),
    getAdminVenueOptions(),
    getAdminMatchApplicationCount(id),
  ]);
  const formAction = updateAdminMatchAction.bind(null, id);
  const deleteAction = deleteAdminMatchAction.bind(null, id);
  const refundExceptionAction = setAdminMatchRefundExceptionAction.bind(null, id);
  const sendRainAlertAction = sendAdminMatchRainAlertAction.bind(null, id);
  const cancelForRainAction = cancelAdminMatchForRainAction.bind(null, id);

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
      <AdminMatchRainPanel
        cancelForRainAction={cancelForRainAction}
        isCancelled={match.status === "cancelled"}
        sendRainAlertAction={sendRainAlertAction}
      />
      <AdminMatchEditor
        canDelete={applicationCount === 0}
        deleteAction={deleteAction}
        deleteConfirmMessage="이 매치를 삭제할까요? 신청 이력이 없는 경우에만 삭제되며, 삭제 후 되돌릴 수 없습니다."
        deleteDisabledReason="신청/참가 이력이 있는 매치는 삭제할 수 없습니다. 참가자 미달 취소나 강수 취소를 사용해 주세요."
        formAction={formAction}
        mode="edit"
        refundExceptionAction={refundExceptionAction}
        values={buildAdminMatchFormValue(match)}
        venueOptions={venueOptions}
      />
    </AdminShell>
  );
}
