import type { AdminVenueFormValue } from "../types";
import ui from "./admin-ui.module.css";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { AdminVenueImageField } from "./admin-venue-image-field";
import styles from "./admin-venue-editor.module.css";

type AdminVenueEditorProps = {
  canDelete?: boolean;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  deleteConfirmMessage?: string;
  deleteDisabledReason?: string;
  mode: "create" | "edit";
  values: AdminVenueFormValue;
  formAction: (formData: FormData) => void | Promise<void>;
};

export function AdminVenueEditor({
  canDelete = false,
  deleteAction,
  deleteConfirmMessage = "",
  deleteDisabledReason = "",
  mode,
  values,
  formAction,
}: AdminVenueEditorProps) {
  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.actionBar}>
        <div>
          <p className={styles.eyebrow}>경기장 기본값 관리</p>
          <h2 className={styles.title}>
            {mode === "create" ? "새 관리 경기장 등록" : "관리 경기장 기본값 수정"}
          </h2>
          <p className={styles.description}>
            여기서 수정한 값은 이후 새 매치를 만들 때 자동으로 불러오는 경기장 기본값입니다.
          </p>
        </div>

        <button className={styles.primaryButton} type="submit">
          {mode === "create" ? "경기장 저장" : "변경 사항 저장"}
        </button>
      </div>

      <section className={styles.section}>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>경기장명</span>
            <input defaultValue={values.name} name="name" type="text" />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>권역</span>
            <input defaultValue={values.district} name="district" type="text" />
          </label>

          <label className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>주소</span>
            <input defaultValue={values.address} name="address" type="text" />
          </label>

          <label className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>코트 특이사항</span>
            <textarea defaultValue={values.courtNote} name="courtNote" rows={5} />
          </label>

          <div className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>경기장 이미지</span>
            <AdminVenueImageField initialUrls={values.defaultImageUrls} />
          </div>

          <label className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>기본 운영 규칙</span>
            <textarea defaultValue={values.defaultRulesText} name="defaultRulesText" rows={5} />
          </label>

          <label className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>기본 안전 메모</span>
            <textarea
              defaultValue={values.defaultSafetyNotesText}
              name="defaultSafetyNotesText"
              rows={5}
            />
          </label>

          <label className={styles.checkboxField}>
            <input defaultChecked={values.isActive} name="isActive" type="checkbox" />
            <span>매치 생성 목록에 노출할 관리 경기장으로 유지</span>
          </label>
        </div>
      </section>

      {mode === "edit" ? (
        <section className={styles.section}>
          <div className={styles.deleteBlock}>
            <div>
              <p className={styles.eyebrow}>삭제</p>
              <h3 className={styles.deleteTitle}>이 경기장을 삭제합니다.</h3>
              <p className={styles.deleteDescription}>
                연결된 매치가 없는 경기장만 삭제할 수 있습니다. 삭제 후 되돌릴 수 없습니다.
              </p>
            </div>

            <div className={styles.deleteActions}>
              <p
                className={`${styles.deleteHint} ${!canDelete ? styles.deleteHintBlocked : ""}`}
              >
                {canDelete
                  ? "삭제하면 관리 경기장 목록과 이후 매치 생성 옵션에서 즉시 사라집니다."
                  : deleteDisabledReason}
              </p>

              <ConfirmSubmitButton
                className={`${ui.button} ${styles.deleteButton}`}
                confirmationMessage={deleteConfirmMessage}
                disabled={!canDelete || !deleteAction}
                formAction={deleteAction}
                formNoValidate
              >
                삭제
              </ConfirmSubmitButton>
            </div>
          </div>
        </section>
      ) : null}
    </form>
  );
}
