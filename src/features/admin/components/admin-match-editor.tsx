"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { formatMoney } from "@/lib/date";
import type { AdminMatchFormValue, AdminVenueOption } from "../types";
import { applyVenueOptionToMatchFormValue } from "../view-model";
import { AdminStatusBadge } from "./admin-status-badge";
import styles from "./admin-match-editor.module.css";

type AdminMatchEditorProps = {
  mode: "create" | "edit";
  values: AdminMatchFormValue;
  venueOptions: AdminVenueOption[];
  formAction: (formData: FormData) => void | Promise<void>;
};

export function AdminMatchEditor({
  mode,
  values,
  venueOptions,
  formAction,
}: AdminMatchEditorProps) {
  const [formValues, setFormValues] = useState(values);

  const selectedVenue = venueOptions.find((venue) => venue.id === formValues.selectedVenueId);

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
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

    setFormValues((currentValues) =>
      applyVenueOptionToMatchFormValue(currentValues, venue),
    );
  }

  const previewTitle = formValues.title || "매치 제목";
  const previewDate = formValues.date || "날짜 미정";
  const previewTime =
    formValues.startTime && formValues.endTime
      ? `${formValues.startTime} - ${formValues.endTime}`
      : "시간 미정";
  const previewVenue = formValues.venueName
    ? `${formValues.venueName}${formValues.district ? ` · ${formValues.district}` : ""}`
    : "경기장을 선택하거나 직접 입력하세요";
  const previewNotice = formValues.publicNotice || "공개 공지가 아직 없습니다.";
  const previewTags = formValues.tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const previewStatusLabel =
    mode === "create" && !formValues.status ? "버튼에서 결정" : "상태 미선택";

  return (
    <div className={styles.layout}>
      <form action={formAction} className={styles.form}>
        <input name="venueEntryMode" type="hidden" value={formValues.venueEntryMode} />
        <input name="selectedVenueId" type="hidden" value={formValues.selectedVenueId} />

        <div className={styles.actionBar}>
          <div>
            <p className={styles.actionEyebrow}>관리자 운영 화면</p>
            <h2 className={styles.actionTitle}>
              {mode === "create" ? "빈 폼에서 새 매치를 여는 방식" : "운영 중인 매치를 다듬는 방식"}
            </h2>
          </div>

          <div className={styles.actionButtons}>
            {mode === "create" ? (
              <button
                className={styles.secondaryButton}
                name="intent"
                type="submit"
                value="publish_now"
              >
                저장 후 바로 모집 열기
              </button>
            ) : null}
            <button
              className={styles.primaryButton}
              name="intent"
              type="submit"
              value={mode === "create" ? "save_draft" : "save_changes"}
            >
              {mode === "create" ? "임시 저장" : "변경 사항 저장"}
            </button>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>경기장 불러오기</p>
            <h3 className={styles.sectionTitle}>관리 경기장을 선택하거나 새 경기장을 직접 입력</h3>
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

          <div className={styles.sourceCard}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>관리 경기장</span>
              <select
                onChange={handleVenueSelectChange}
                value={formValues.selectedVenueId}
              >
                <option value="">관리 중인 경기장을 선택하세요</option>
                {venueOptions.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.label}
                    {venue.isActive ? "" : " · 보관"}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.sourceHint}>
              <strong>
                {selectedVenue ? `${selectedVenue.label} 기준으로 채워짐` : "선택한 경기장 기준 자동 채움"}
              </strong>
              <p>
                경기장을 선택하면 장소 정보, 이미지, 운영 규칙, 안전 메모가 바로 채워집니다.
                이후 수정한 값은 이번 매치에만 저장됩니다.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>기본 정보</p>
            <h3 className={styles.sectionTitle}>매치 정보와 노출 상태</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>매치 제목</span>
              <input
                name="title"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.title}
              />
            </label>

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

            <label className={styles.field}>
              <span className={styles.fieldLabel}>권역</span>
              <input
                name="district"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.district}
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
              <span className={styles.fieldLabel}>종료 시간</span>
              <input
                name="endTime"
                onChange={handleFieldChange}
                required
                type="time"
                value={formValues.endTime}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>경기 방식</span>
              <select name="format" onChange={handleFieldChange} required value={formValues.format}>
                <option value="">경기 방식을 선택하세요</option>
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
              <span className={styles.fieldLabel}>현재 신청 현황</span>
              <input readOnly type="text" value={formValues.participantSummary} />
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
              <span className={styles.fieldLabel}>성별 조건</span>
              <input
                name="genderCondition"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.genderCondition}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>레벨 조건</span>
              <input
                name="levelCondition"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.levelCondition}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>레벨 범위</span>
              <input
                name="levelRange"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.levelRange}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>준비물</span>
              <input
                name="preparation"
                onChange={handleFieldChange}
                required
                type="text"
                value={formValues.preparation}
              />
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
              <textarea
                name="summary"
                onChange={handleFieldChange}
                required
                rows={3}
                value={formValues.summary}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>공개 공지</span>
              <textarea
                name="publicNotice"
                onChange={handleFieldChange}
                required
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

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>장소 안내</p>
            <h3 className={styles.sectionTitle}>현장 운영 정보와 경기장 기본값</h3>
          </div>

          <div className={styles.fieldGrid}>
            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>찾아오는 길</span>
              <textarea
                name="directions"
                onChange={handleFieldChange}
                required
                rows={3}
                value={formValues.directions}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>주차</span>
              <textarea
                name="parking"
                onChange={handleFieldChange}
                required
                rows={3}
                value={formValues.parking}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>흡연</span>
              <textarea
                name="smoking"
                onChange={handleFieldChange}
                required
                rows={3}
                value={formValues.smoking}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>보관/샤워</span>
              <textarea
                name="showerLocker"
                onChange={handleFieldChange}
                required
                rows={3}
                value={formValues.showerLocker}
              />
            </label>

            <label className={`${styles.field} ${styles.fieldSpan}`}>
              <span className={styles.fieldLabel}>이미지 URL</span>
              <textarea
                name="imageUrlsText"
                onChange={handleFieldChange}
                rows={4}
                value={formValues.imageUrlsText}
              />
            </label>

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
                required
                rows={4}
                value={formValues.operatorNote}
              />
            </label>
          </div>
        </section>
      </form>

      <aside className={styles.aside}>
        <section className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <p className={styles.previewLabel}>미리 보는 운영 카드</p>
            {formValues.status ? (
              <AdminStatusBadge status={formValues.status} />
            ) : (
              <span className={styles.previewBadgeEmpty}>{previewStatusLabel}</span>
            )}
          </div>

          <h3 className={styles.previewTitle}>{previewTitle}</h3>
          <p className={styles.previewMeta}>
            {previewDate} · {previewTime}
          </p>
          <p className={styles.previewMeta}>{previewVenue}</p>

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

          <div className={styles.previewTags}>
            {previewTags.map((tag) => (
              <span key={tag} className={styles.previewTag}>
                {tag}
              </span>
            ))}
          </div>

          <p className={styles.previewNotice}>{previewNotice}</p>
        </section>

        <section className={styles.previewCard}>
          <p className={styles.previewLabel}>현재 입력 방식</p>
          <ul className={styles.previewList}>
            <li>
              {formValues.venueEntryMode === "managed"
                ? "관리 경기장을 기준으로 필요한 값을 채우고 있습니다."
                : "새 경기장을 직접 입력하는 방식입니다."}
            </li>
            <li>
              {selectedVenue
                ? `선택된 경기장: ${selectedVenue.label}`
                : "등록된 경기장을 고르면 경기장 정보, 이미지, 규칙, 안전 메모가 자동으로 채워집니다."}
            </li>
            <li>경기장을 불러온 뒤 수정한 값은 이번 매치에만 저장됩니다.</li>
          </ul>
        </section>
      </aside>
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
