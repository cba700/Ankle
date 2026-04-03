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
      description="매치 고유 정보는 비운 상태에서 시작하고, 관리 경기장을 선택하면 경기장 기본값만 한 번에 채워집니다."
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
