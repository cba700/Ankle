"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { formatMoney } from "@/lib/date";
import {
  buildAdminVenueLabel,
  buildGeneratedMatchTitle,
  formatMatchDurationLabel,
  MATCH_DURATION_OPTIONS,
} from "../match-form";
import type {
  AdminMatchFormValue,
  AdminMatchRefundExceptionMode,
  AdminVenueOption,
} from "../types";
import {
  applyVenueOptionToMatchFormValue,
  getAdminMatchRefundExceptionMeta,
} from "../view-model";
import { AdminStatusBadge } from "./admin-status-badge";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import ui from "./admin-ui.module.css";
import styles from "./admin-match-editor.module.css";

type AdminMatchEditorProps = {
  canDelete?: boolean;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  deleteConfirmMessage?: string;
  deleteDisabledReason?: string;
  mode: "create" | "edit";
  values: AdminMatchFormValue;
  venueOptions: AdminVenueOption[];
  formAction: (formData: FormData) => void | Promise<void>;
  formId?: string;
  refundExceptionAction?: (formData: FormData) => void | Promise<void>;
};

const GENDER_OPTIONS = ["남녀 모두", "남성만", "여성만"];
const LEVEL_OPTIONS = [
  { value: "all", label: "모든 레벨" },
  { value: "basic", label: "초급 위주" },
  { value: "middle", label: "중급 위주" },
  { value: "high", label: "상급 위주" },
] as const;
const REFUND_EXCEPTION_ACTIONS: Array<{
  label: string;
  mode: AdminMatchRefundExceptionMode;
}> = [
  { label: "예외 종료", mode: "none" },
  { label: "미달 안내(전날)", mode: "participant_shortage_day_before" },
  { label: "미달 안내(당일)", mode: "participant_shortage_same_day" },
  { label: "강수 안내", mode: "rain_notice" },
  { label: "강수 변동 안내", mode: "rain_change_notice" },
];
const CAPACITY_BY_FORMAT: Record<string, string> = {
  "3vs3": "9",
  "4vs4": "12",
  "5vs5": "15",
};

export function AdminMatchEditor({
  canDelete = false,
  deleteAction,
  deleteConfirmMessage = "",
  deleteDisabledReason = "",
  mode,
  values,
  venueOptions,
  formAction,
  formId,
  refundExceptionAction,
}: AdminMatchEditorProps) {
  const [formValues, setFormValues] = useState(values);

  const selectedVenue = venueOptions.find((venue) => venue.id === formValues.selectedVenueId);
  const generatedTitle = buildGeneratedMatchTitle({
    venueName: formValues.venueName,
    format: formValues.format,
    startTime: formValues.startTime,
  });
  const refundExceptionMeta = getAdminMatchRefundExceptionMeta(
    formValues.refundExceptionMode,
  );
  const durationOptions = getDurationOptions(formValues.durationMinutes);
  const genderOptions = getOptionsWithCurrent(GENDER_OPTIONS, formValues.genderCondition);

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: value,
      };

      if (name === "format" && CAPACITY_BY_FORMAT[value]) {
        nextValues.capacity = CAPACITY_BY_FORMAT[value];
      }

      return nextValues;
    });
  }

  function handleVenueModeChange(modeValue: AdminMatchFormValue["venueEntryMode"]) {
    setFormValues((currentValues) => ({
      ...currentValues,
      venueEntryMode: modeValue,
      selectedVenueId: modeValue === "manual" ? "" : currentValues.selectedVenueId,
    }));
  }

  function handleVenueSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const venueId = event.target.value;

    if (!venueId) {
      setFormValues((currentValues) => ({
        ...currentValues,
        selectedVenueId: "",
      }));
      return;
    }

    const venue = venueOptions.find((item) => item.id === venueId);

    if (!venue) {
      return;
    }

    setFormValues((currentValues) => applyVenueOptionToMatchFormValue(currentValues, venue));
  }

  return (
    <div className={`${styles.layout} ${mode === "create" ? styles.layoutSingle : ""}`}>
      <form action={formAction} className={styles.form} id={formId} name={formId}>
        <input name="venueEntryMode" type="hidden" value={formValues.venueEntryMode} />
        <input name="selectedVenueId" type="hidden" value={formValues.selectedVenueId} />
        <input name="imageUrlsText" type="hidden" value={formValues.imageUrlsText} />
        {mode === "create" ? (
          <>
            <input name="district" type="hidden" value={formValues.district} />
            <input name="courtNote" type="hidden" value={formValues.courtNote} />
            <input name="rulesText" type="hidden" value={formValues.rulesText} />
            <input name="safetyNotesText" type="hidden" value={formValues.safetyNotesText} />
          </>
        ) : null}

        {mode === "edit" ? (
          <div className={`${ui.sectionCard} ${styles.actionBar}`}>
            <div className={styles.actionCopy}>
              <p className={styles.sectionEyebrow}>편집</p>
              <h2 className={styles.actionTitle}>운영 중인 매치를 정리합니다.</h2>
            </div>

            <button className={`${ui.button} ${ui.buttonPrimary}`} name="intent" type="submit" value="save_changes">
              변경 사항 저장
            </button>
          </div>
        ) : null}

        <section className={`${ui.sectionCard} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>경기장</p>
          </div>

          <div className={styles.modeToggle}>
            <button
              aria-pressed={formValues.venueEntryMode === "managed"}
              className={`${styles.modeButton} ${formValues.venueEntryMode === "managed" ? styles.modeButtonActive : ""}`}
              onClick={() => handleVenueModeChange("managed")}
              type="button"
            >
              관리 경기장 선택
            </button>
            <button
              aria-pressed={formValues.venueEntryMode === "manual"}
              className={`${styles.modeButton} ${formValues.venueEntryMode === "manual" ? styles.modeButtonActive : ""}`}
              onClick={() => handleVenueModeChange("manual")}
              type="button"
            >
              새 경기장 직접 입력
            </button>
          </div>

          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>관리 경기장</span>
              <select onChange={handleVenueSelectChange} value={formValues.selectedVenueId}>
                <option value="">관리 중인 경기장을 선택하세요</option>
                {venueOptions.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.label}
                    {venue.isActive ? "" : " · 보관"}
                  </option>
                ))}
              </select>
            </label>

            <p className={styles.helperText}>
              {selectedVenue
                ? `${selectedVenue.label} 기준으로 장소 정보와 기본값이 채워집니다.`
                : "경기장을 고르면 장소 정보와 기본값이 자동으로 채워집니다."}
            </p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>경기장명</span>
              <input
                name="venueName"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.venueName}
              />
            </label>

            {mode === "edit" ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>권역</span>
                <input
                  name="district"
                  onChange={handleFieldChange}
                  type="text"
                  value={formValues.district}
                />
              </label>
            ) : null}

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>주소</span>
              <input
                name="address"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.address}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>기상청 격자 X(nx)</span>
              <input
                inputMode="numeric"
                name="weatherGridNx"
                onChange={handleFieldChange}
                placeholder="예: 60"
                type="text"
                value={formValues.weatherGridNx}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>기상청 격자 Y(ny)</span>
              <input
                inputMode="numeric"
                name="weatherGridNy"
                onChange={handleFieldChange}
                placeholder="예: 127"
                type="text"
                value={formValues.weatherGridNy}
              />
            </label>
          </div>
        </section>

        <section className={`${ui.sectionCard} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>기본 정보</p>
          </div>

          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>매치 제목</span>
              <input
                name="title"
                onChange={handleFieldChange}
                placeholder={
                  mode === "create" ? `비워두면 ${generatedTitle || "자동 제목"}으로 저장됩니다.` : undefined
                }
                type="text"
                value={formValues.title}
              />
            </label>

            {mode === "edit" ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>운영 상태</span>
                <select
                  name="status"
                  onChange={handleFieldChange}
                  required
                  value={formValues.status}
                >
                  <option value="">운영 상태를 선택하세요</option>
                  <option value="draft">임시 저장</option>
                  <option value="open">모집 중</option>
                  <option value="closed">마감</option>
                  <option value="cancelled">운영 취소</option>
                </select>
              </label>
            ) : null}

            <label className={styles.field}>
              <span className={styles.fieldLabel}>날짜</span>
              <input
                name="date"
                onChange={handleFieldChange}
                required
                type="date"
                value={formValues.date}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>시작 시간</span>
              <input
                name="startTime"
                onChange={handleFieldChange}
                required
                type="time"
                value={formValues.startTime}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>경기 시간</span>
              <select
                name="durationMinutes"
                onChange={handleFieldChange}
                required
                value={formValues.durationMinutes}
              >
                <option value="">경기시간을 선택하세요</option>
                {durationOptions.map((option) => (
                  <option key={option} value={String(option)}>
                    {formatMatchDurationLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>방식</span>
              <select name="format" onChange={handleFieldChange} required value={formValues.format}>
                <option value="">경기 방식을 선택하세요</option>
                <option value="3vs3">3vs3</option>
                <option value="4vs4">4vs4</option>
                <option value="5vs5">5vs5</option>
              </select>
            </label>
          </div>
        </section>

        <section className={`${ui.sectionCard} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>참가 조건</p>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>정원</span>
              <input
                inputMode="numeric"
                name="capacity"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.capacity}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>참가비</span>
              <input
                inputMode="numeric"
                name="price"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.price}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>레벨</span>
              <select
                name="level"
                onChange={handleFieldChange}
                required
                value={formValues.level}
              >
                <option value="">레벨을 선택하세요</option>
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>성별 조건</span>
              <select
                name="genderCondition"
                onChange={handleFieldChange}
                required
                value={formValues.genderCondition}
              >
                <option value="">성별 조건을 선택하세요</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {mode === "edit" ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>현재 신청 현황</span>
                  <input readOnly type="text" value={formValues.participantSummary} />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>준비물</span>
                  <input
                    name="preparation"
                    onChange={handleFieldChange}
                    type="text"
                    value={formValues.preparation}
                  />
                </label>
              </>
            ) : null}
          </div>
        </section>

        {mode === "edit" ? (
          <>
            <section className={`${ui.sectionCard} ${styles.section}`}>
              <div className={styles.refundExceptionHeader}>
                <p className={styles.sectionEyebrow}>환불 예외 운영</p>
                <AdminStatusBadge
                  label={refundExceptionMeta.label}
                  tone={refundExceptionMeta.tone}
                />
              </div>

              <p className={styles.helperText}>{refundExceptionMeta.description}</p>

              <div className={styles.refundActionGrid}>
                {REFUND_EXCEPTION_ACTIONS.map((action) => (
                  <button
                    className={`${ui.button} ${ui.buttonSmall} ${
                      action.mode === formValues.refundExceptionMode ? ui.buttonBrand : ""
                    } ${styles.refundActionButton}`}
                    disabled={!refundExceptionAction}
                    formAction={refundExceptionAction}
                    formNoValidate
                    key={action.mode}
                    name="refundExceptionMode"
                    type="submit"
                    value={action.mode}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>

            <section className={`${ui.sectionCard} ${styles.section}`}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>운영 카피</p>
              </div>

              <div className={styles.fieldGrid}>
                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>한 줄 요약</span>
                  <textarea
                    name="summary"
                    onChange={handleFieldChange}
                    rows={3}
                    value={formValues.summary}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>공개 공지</span>
                  <textarea
                    name="publicNotice"
                    onChange={handleFieldChange}
                    rows={3}
                    value={formValues.publicNotice}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>태그</span>
                  <input
                    name="tagsText"
                    onChange={handleFieldChange}
                    type="text"
                    value={formValues.tagsText}
                  />
                </label>
              </div>
            </section>

            <section className={`${ui.sectionCard} ${styles.section}`}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>장소 안내</p>
              </div>

              <div className={styles.fieldGrid}>
                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>코트 특이사항</span>
                  <textarea
                    name="courtNote"
                    onChange={handleFieldChange}
                    rows={5}
                    value={formValues.courtNote}
                  />
                </label>

                <p className={styles.helperText}>
                  매치 상세 이미지는 경기장에 등록된 사진을 그대로 사용합니다.
                </p>

                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>운영 규칙</span>
                  <textarea
                    name="rulesText"
                    onChange={handleFieldChange}
                    rows={5}
                    value={formValues.rulesText}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>안전 메모</span>
                  <textarea
                    name="safetyNotesText"
                    onChange={handleFieldChange}
                    rows={5}
                    value={formValues.safetyNotesText}
                  />
                </label>

                <label className={`${styles.field} ${styles.fieldSpan}`}>
                  <span className={styles.fieldLabel}>내부 운영 메모</span>
                  <textarea
                    name="operatorNote"
                    onChange={handleFieldChange}
                    rows={4}
                    value={formValues.operatorNote}
                  />
                </label>
              </div>
            </section>

            <section className={`${ui.sectionCard} ${styles.section}`}>
              <div className={styles.deleteBlock}>
                <div>
                  <p className={styles.sectionEyebrow}>삭제</p>
                  <h3 className={styles.deleteTitle}>이 매치를 삭제합니다.</h3>
                  <p className={styles.deleteDescription}>
                    신청 이력이 없는 매치만 삭제할 수 있습니다. 삭제 후 되돌릴 수 없습니다.
                  </p>
                </div>

                <div className={styles.deleteActions}>
                  <p
                    className={`${styles.deleteHint} ${!canDelete ? styles.deleteHintBlocked : ""}`}
                  >
                    {canDelete
                      ? "삭제하면 운영 목록과 편집 페이지에서 즉시 사라집니다."
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
          </>
        ) : null}
      </form>

      {mode === "edit" ? (
        <aside className={styles.aside}>
          <section className={`${ui.sectionCard} ${styles.previewCard}`}>
            <div className={styles.previewHeader}>
              <p className={styles.sectionEyebrow}>미리 보기</p>
              {formValues.status ? <AdminStatusBadge status={formValues.status} /> : null}
            </div>

            <h3 className={styles.previewTitle}>{formValues.title || generatedTitle || "매치 제목"}</h3>
            <p className={styles.previewMeta}>
              {formValues.date || "날짜 미정"} ·{" "}
              {formValues.startTime && formValues.durationMinutes
                ? `${formValues.startTime} 시작 · ${formatMatchDurationLabel(
                    Number.parseInt(formValues.durationMinutes, 10),
                  )}`
                : "시간 미정"}
            </p>
            <p className={styles.previewMeta}>
              {formValues.venueName
                ? buildAdminVenueLabel(formValues.venueName, formValues.district)
                : "경기장을 선택하거나 직접 입력하세요"}
            </p>

            <div className={styles.previewStats}>
              <div>
                <span>참가 현황</span>
                <strong>{formValues.participantSummary}</strong>
              </div>
              <div>
                <span>참가비</span>
                <strong>{formatPreviewPrice(formValues.price)}</strong>
              </div>
            </div>
          </section>
        </aside>
      ) : null}
    </div>
  );
}

function formatPreviewPrice(value: string) {
  const amount = Number.parseInt(value, 10);

  if (Number.isNaN(amount)) {
    return value ? `${value}원` : "참가비 미입력";
  }

  return `${formatMoney(amount)}원`;
}

function getDurationOptions(currentValue: string) {
  const current = Number.parseInt(currentValue, 10);

  if (!Number.isFinite(current) || current <= 0 || MATCH_DURATION_OPTIONS.includes(current)) {
    return MATCH_DURATION_OPTIONS;
  }

  return [...MATCH_DURATION_OPTIONS, current].sort((left, right) => left - right);
}

function getOptionsWithCurrent(options: string[], currentValue: string) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
}
