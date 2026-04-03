import { createAdminMatchAction } from "@/features/admin/actions";
import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminShell } from "@/features/admin/components/admin-shell";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminVenueOptions } from "@/features/admin/data";
import { applyVenueOptionToMatchFormValue, buildAdminMatchFormValue } from "@/features/admin/view-model";

const CREATE_MATCH_FORM_ID = "admin-match-create-form";

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
      actions={
        <>
          <button
            className={ui.button}
            form={CREATE_MATCH_FORM_ID}
            name="intent"
            type="submit"
            value="save_draft"
          >
            임시 저장
          </button>
          <button
            className={`${ui.button} ${ui.buttonBrand}`}
            form={CREATE_MATCH_FORM_ID}
            name="intent"
            type="submit"
            value="publish_now"
          >
            저장 후 모집 열기
          </button>
        </>
      }
      eyebrow="CREATE MATCH"
      title="새 매치 열기"
    >
      <AdminMatchEditor
        formId={CREATE_MATCH_FORM_ID}
        formAction={createAdminMatchAction}
        mode="create"
        values={initialValues}
        venueOptions={venueOptions}
      />
    </AdminShell>
  );
}
