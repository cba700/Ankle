import { createAdminMatchAction } from "@/features/admin/actions";
import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getAdminVenueOptions } from "@/features/admin/data";
import { applyVenueOptionToMatchFormValue, buildAdminMatchFormValue } from "@/features/admin/view-model";

export default async function AdminNewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ venueId?: string }>;
}) {
  const { venueId } = await searchParams;
  const venueOptions = await getAdminVenueOptions();
  const selectedVenue = venueOptions.find((venue) => venue.id === venueId);
  const initialValues = selectedVenue
    ? applyVenueOptionToMatchFormValue(buildAdminMatchFormValue(), selectedVenue)
    : buildAdminMatchFormValue();

  return (
    <AdminShell
      activeNav="create"
      description="위치, 시작 시간, 경기시간, 레벨, 성별 조건, 방식, 정원, 가격만 먼저 입력하고 나머지는 저장 뒤 편집 화면에서 다듬을 수 있습니다."
      eyebrow="Create Match"
      title="새 매치 열기"
    >
      <AdminMatchEditor
        formAction={createAdminMatchAction}
        mode="create"
        values={initialValues}
        venueOptions={venueOptions}
      />
    </AdminShell>
  );
}
