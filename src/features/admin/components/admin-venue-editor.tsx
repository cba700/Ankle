import type { AdminVenueFormValue } from "../types";
import { AdminVenueImageField } from "./admin-venue-image-field";
import styles from "./admin-venue-editor.module.css";

type AdminVenueEditorProps = {
  mode: "create" | "edit";
  values: AdminVenueFormValue;
  formAction: (formData: FormData) => void | Promise<void>;
};

export function AdminVenueEditor({
  mode,
  values,
  formAction,
}: AdminVenueEditorProps) {
  return (
    <form action={formAction} className={styles.form} encType="multipart/form-data">
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
            <span className={styles.fieldLabel}>찾아오는 길</span>
            <textarea defaultValue={values.directions} name="directions" rows={3} />
          </label>

          <label className={`${styles.field} ${styles.fieldSpan}`}>
            <span className={styles.fieldLabel}>주차</span>
            <textarea defaultValue={values.parking} name="parking" rows={3} />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>흡연</span>
            <textarea defaultValue={values.smoking} name="smoking" rows={3} />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>보관/샤워</span>
            <textarea defaultValue={values.showerLocker} name="showerLocker" rows={3} />
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
    </form>
  );
}
