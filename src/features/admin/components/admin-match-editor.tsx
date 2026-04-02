import { formatMoney } from "@/lib/date";
import type { AdminMatchFormValue } from "../types";
import { AdminStatusBadge } from "./admin-status-badge";
import styles from "./admin-match-editor.module.css";

type AdminMatchEditorProps = {
  mode: "create" | "edit";
  values: AdminMatchFormValue;
};

export function AdminMatchEditor({
  mode,
  values,
}: AdminMatchEditorProps) {
  const primaryActionLabel =
    mode === "create" ? "임시 저장" : "변경 사항 저장";

  const secondaryActionLabel =
    mode === "create" ? "바로 모집 열기" : "모집 상태 업데이트";

  return (
    <div className={styles.layout}>
      <form className={styles.form}>
        <div className={styles.actionBar}>
          <div>
            <p className={styles.actionEyebrow}>관리자 목업 화면</p>
            <h2 className={styles.actionTitle}>
              {mode === "create" ? "새 회차를 설계하는 폼" : "운영 중인 회차를 다듬는 폼"}
            </h2>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.secondaryButton} type="button">
              {secondaryActionLabel}
            </button>
            <button className={styles.primaryButton} type="button">
              {primaryActionLabel}
            </button>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>기본 정보</p>
            <h3 className={styles.sectionTitle}>매치 정보와 노출 상태</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>매치 제목</span>
              <input defaultValue={values.title} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>장소명</span>
              <input defaultValue={values.venueName} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>권역</span>
              <input defaultValue={values.district} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>운영 상태</span>
              <select defaultValue={values.status}>
                <option value="draft">임시 저장</option>
                <option value="open">모집 중</option>
                <option value="closed">마감</option>
                <option value="cancelled">운영 취소</option>
              </select>
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>주소</span>
              <input defaultValue={values.address} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>날짜</span>
              <input defaultValue={values.date} type="date" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>시작 시간</span>
              <input defaultValue={values.startTime} type="time" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>종료 시간</span>
              <input defaultValue={values.endTime} type="time" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>경기 방식</span>
              <select defaultValue={values.format}>
                <option value="3vs3">3vs3</option>
                <option value="5vs5">5vs5</option>
              </select>
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>참가 조건</p>
            <h3 className={styles.sectionTitle}>정원, 가격, 레벨 기준</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>정원</span>
              <input defaultValue={values.capacity} inputMode="numeric" type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>현재 신청자 수</span>
              <input
                defaultValue={values.currentParticipants}
                inputMode="numeric"
                type="text"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>참가비</span>
              <input defaultValue={values.price} inputMode="numeric" type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>성별 조건</span>
              <input defaultValue={values.genderCondition} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>레벨 조건</span>
              <input defaultValue={values.levelCondition} type="text" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>레벨 범위</span>
              <input defaultValue={values.levelRange} type="text" />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>준비물</span>
              <input defaultValue={values.preparation} type="text" />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>운영 카피</p>
            <h3 className={styles.sectionTitle}>유저에게 보일 설명과 공지</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>한 줄 요약</span>
              <textarea defaultValue={values.summary} rows={3} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>공개 공지</span>
              <textarea defaultValue={values.publicNotice} rows={3} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>태그</span>
              <input defaultValue={values.tagsText} type="text" />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>장소 안내</p>
            <h3 className={styles.sectionTitle}>현장 운영 정보와 안전 메모</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>찾아오는 길</span>
              <textarea defaultValue={values.directions} rows={3} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>주차</span>
              <textarea defaultValue={values.parking} rows={3} />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>흡연</span>
              <textarea defaultValue={values.smoking} rows={3} />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>보관/샤워</span>
              <textarea defaultValue={values.showerLocker} rows={3} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>운영 규칙</span>
              <textarea defaultValue={values.rulesText} rows={5} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>안전 메모</span>
              <textarea defaultValue={values.safetyNotesText} rows={5} />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>내부 운영 메모</span>
              <textarea defaultValue={values.operatorNote} rows={4} />
            </label>
          </div>
        </section>
      </form>

      <aside className={styles.aside}>
        <section className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <p className={styles.previewLabel}>미리 보는 운영 카드</p>
            <AdminStatusBadge status={values.status} />
          </div>

          <h3 className={styles.previewTitle}>{values.title}</h3>
          <p className={styles.previewMeta}>
            {values.date} · {values.startTime} - {values.endTime}
          </p>
          <p className={styles.previewMeta}>
            {values.venueName} · {values.district}
          </p>

          <div className={styles.previewStats}>
            <div>
              <span>참가 현황</span>
              <strong>
                {values.currentParticipants} / {values.capacity}명
              </strong>
            </div>
            <div>
              <span>참가비</span>
              <strong>{formatPreviewPrice(values.price)}</strong>
            </div>
          </div>

          <div className={styles.previewTags}>
            {values.tagsText.split(",").map((tag) => {
              const trimmedTag = tag.trim();

              if (!trimmedTag) {
                return null;
              }

              return (
                <span key={trimmedTag} className={styles.previewTag}>
                  {trimmedTag}
                </span>
              );
            })}
          </div>

          <p className={styles.previewNotice}>{values.publicNotice}</p>
        </section>

        <section className={styles.previewCard}>
          <p className={styles.previewLabel}>현재 연결 범위</p>
          <ul className={styles.previewList}>
            <li>이 화면은 목업이며 저장 동작은 연결되지 않았습니다.</li>
            <li>기존 메인과 상세 페이지 데이터 소스에는 영향을 주지 않습니다.</li>
            <li>실데이터 연결 시 이 폼 구조를 그대로 서버 액션 또는 API에 연결할 수 있습니다.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function formatPreviewPrice(value: string) {
  const amount = Number.parseInt(value, 10);

  if (Number.isNaN(amount)) {
    return value;
  }

  return `${formatMoney(amount)}원`;
}
