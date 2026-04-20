"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon } from "@/components/icons";
import type { HomeFilterGroup, HomeFilterGroupId, HomeFilterState } from "./home-types";
import styles from "./home-filter-bar.module.css";

type HomeFilterBarProps = {
  filterState: HomeFilterState;
  groups: HomeFilterGroup[];
  onApplyGroupFilters: (groupId: HomeFilterGroupId, nextValues: string[]) => void;
  onToggleHideClosed: () => void;
};

export function HomeFilterBar({
  filterState,
  groups,
  onApplyGroupFilters,
  onToggleHideClosed,
}: HomeFilterBarProps) {
  const [activeGroupId, setActiveGroupId] = useState<HomeFilterGroupId | null>(null);
  const [draftValues, setDraftValues] = useState<string[]>([]);

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? null,
    [activeGroupId, groups],
  );

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeGroupId]);

  function handleOpenGroup(groupId: HomeFilterGroupId) {
    setDraftValues([...(filterState[groupId] as string[])]);
    setActiveGroupId(groupId);
  }

  function handleCloseGroup() {
    setActiveGroupId(null);
    setDraftValues([]);
  }

  function handleToggleDraftValue(optionId: string) {
    setDraftValues((current) =>
      current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId],
    );
  }

  function handleResetDraft() {
    setDraftValues([]);
  }

  function handleApplyDraft() {
    if (!activeGroup) {
      return;
    }

    const sortedValues = activeGroup.options
      .map((option) => option.id)
      .filter((optionId) => draftValues.includes(optionId));

    onApplyGroupFilters(activeGroup.id, sortedValues);
    handleCloseGroup();
  }

  return (
    <section className={styles.section}>
      <div className={styles.row}>
        <button
          aria-pressed={filterState.hideClosed}
          className={`${styles.triggerChip} ${filterState.hideClosed ? styles.triggerChipActive : ""}`}
          onClick={onToggleHideClosed}
          type="button"
        >
          마감 가리기
        </button>

        {groups.map((group) => {
          const selectedValues = filterState[group.id] as string[];
          const isActive = selectedValues.length > 0;

          return (
            <button
              aria-haspopup="dialog"
              aria-pressed={isActive}
              className={`${styles.triggerChip} ${isActive ? styles.triggerChipActive : ""}`}
              key={group.id}
              onClick={() => handleOpenGroup(group.id)}
              type="button"
            >
              {getGroupTriggerLabel(group, selectedValues)}
            </button>
          );
        })}
      </div>

      {activeGroup && typeof document !== "undefined"
        ? createPortal(
            <div className={styles.sheetRoot}>
              <button
                aria-label="필터 닫기"
                className={styles.sheetBackdrop}
                onClick={handleCloseGroup}
                type="button"
              />
              <section
                aria-labelledby={`home-filter-${activeGroup.id}-title`}
                aria-modal="true"
                className={styles.sheet}
                role="dialog"
              >
                <div className={styles.sheetHeader}>
                  <div className={styles.sheetTitleRow}>
                    <button
                      aria-label="필터 닫기"
                      className={styles.sheetCloseButton}
                      onClick={handleCloseGroup}
                      type="button"
                    >
                      <ArrowLeftIcon className={styles.sheetBackIcon} />
                    </button>
                    <div className={styles.sheetTitleCopy}>
                      <h2 className={styles.sheetTitle} id={`home-filter-${activeGroup.id}-title`}>
                        {activeGroup.label} 선택
                      </h2>
                      <p className={styles.sheetDescription}>
                        여러 항목을 선택하고 적용해 보세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.sheetBody}>
                  <div className={styles.optionGrid}>
                    {activeGroup.options.map((option) => {
                      const isSelected = draftValues.includes(option.id);

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`${styles.optionChip} ${isSelected ? styles.optionChipActive : ""}`}
                          key={option.id}
                          onClick={() => handleToggleDraftValue(option.id)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.sheetFooter}>
                  <button
                    className={styles.secondaryButton}
                    onClick={handleResetDraft}
                    type="button"
                  >
                    초기화
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={handleApplyDraft}
                    type="button"
                  >
                    적용
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

function getGroupTriggerLabel(group: HomeFilterGroup, selectedValues: string[]) {
  if (selectedValues.length === 0) {
    return group.label;
  }

  const selectedLabels = group.options
    .filter((option) => selectedValues.includes(option.id))
    .map((option) => option.label);

  if (selectedLabels.length === 1) {
    return selectedLabels[0] ?? group.label;
  }

  return `${group.label} ${selectedLabels.length}`;
}
