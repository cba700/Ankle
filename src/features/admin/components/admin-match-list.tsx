"use client";

import { Fragment, useMemo, useState } from "react";
import {
  PLAYER_LEVEL_CATEGORIES,
  PLAYER_LEVEL_NUMBERS,
  parsePlayerLevelValue,
} from "@/lib/player-levels";
import { AppLink } from "@/components/navigation/app-link";
import type { AdminMatchRow } from "../types";
import { AdminStatusBadge } from "./admin-status-badge";
import ui from "./admin-ui.module.css";
import styles from "./admin-match-list.module.css";

type AdminMatchListProps = {
  onUpdatePlayerLevel?: (formData: FormData) => void | Promise<void>;
  rows: AdminMatchRow[];
  variant: "dashboard" | "matches";
  title?: string;
};

type MatchFilter = "all" | "open" | "today" | "draft" | "nearClosing" | "closed" | "cancelled";

export function AdminMatchList({
  onUpdatePlayerLevel,
  rows,
  variant,
  title,
}: AdminMatchListProps) {
  const [activeFilter, setActiveFilter] = useState<MatchFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMatchIds, setExpandedMatchIds] = useState<string[]>([]);
  const [levelSelections, setLevelSelections] = useState<Record<string, { category: string; levelNumber: string }>>({});
  const tabs = getMatchFilterTabs(rows);
  const filteredRows = useMemo(
    () =>
      variant === "matches"
        ? filterRows(rows, activeFilter, searchQuery)
        : rows,
    [activeFilter, rows, searchQuery, variant],
  );

  function toggleExpandedMatch(matchId: string) {
    setExpandedMatchIds((current) =>
      current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId],
    );
  }

  function updateParticipantLevelSelection(
    userId: string,
    nextSelection: Partial<{ category: string; levelNumber: string }>,
    currentLevel: string | null,
  ) {
    setLevelSelections((current) => {
      const fallback = parsePlayerLevelValue(currentLevel);
      const previous = current[userId] ?? {
        category: fallback?.category ?? "",
        levelNumber: fallback?.levelNumber ?? "",
      };

      return {
        ...current,
        [userId]: {
          category: nextSelection.category ?? previous.category,
          levelNumber: nextSelection.levelNumber ?? previous.levelNumber,
        },
      };
    });
  }

  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}

      {variant === "matches" ? (
        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <input
              className={styles.searchInput}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="매치명 또는 경기장으로 찾기"
              type="search"
              value={searchQuery}
            />
          </div>

          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeFilter === tab.id ? styles.tabActive : ""}`}
                onClick={() => setActiveFilter(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={ui.tableCard}>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead>
              {variant === "dashboard" ? (
                <tr>
                  <th className={ui.tableHeadCell}>매치명</th>
                  <th className={ui.tableHeadCell}>경기장</th>
                  <th className={ui.tableHeadCell}>일정</th>
                  <th className={ui.tableHeadCell}>참가</th>
                  <th className={ui.tableHeadCell}>참가비</th>
                  <th className={ui.tableHeadCell}>상태</th>
                  <th className={ui.tableHeadCell} />
                </tr>
              ) : (
                <tr>
                  <th className={ui.tableHeadCell}>매치명</th>
                  <th className={ui.tableHeadCell}>경기장 · 구</th>
                  <th className={ui.tableHeadCell}>일정 · 경기시간</th>
                  <th className={ui.tableHeadCell}>참가</th>
                  <th className={ui.tableHeadCell}>참가비</th>
                  <th className={ui.tableHeadCell}>레벨</th>
                  <th className={ui.tableHeadCell}>상태</th>
                  <th className={ui.tableHeadCell} />
                </tr>
              )}
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    className={`${ui.tableCell} ${styles.empty}`}
                    colSpan={variant === "dashboard" ? 7 : 8}
                  >
                    표시할 매치가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isExpanded = expandedMatchIds.includes(row.id);

                  return (
                    <Fragment key={row.id}>
                      <tr key={row.id} className={ui.tableRow}>
                        {variant === "dashboard" ? (
                          <>
                            <td className={ui.tableCell}>
                              <strong className={styles.primaryText}>{row.title}</strong>
                            </td>
                            <td className={ui.tableCell}>
                              <span className={ui.muted}>{row.venueLabel}</span>
                            </td>
                            <td className={ui.tableCell}>
                              <span className={ui.muted}>
                                {row.dateLabel} · {row.timeLabel}
                              </span>
                            </td>
                            <td className={ui.tableCell}>
                              <span className={ui.muted}>
                                {row.participantCount} / {row.capacity}명
                              </span>
                            </td>
                            <td className={ui.tableCell}>{row.priceLabel}</td>
                            <td className={ui.tableCell}>
                              <AdminStatusBadge
                                label={row.displayStatusLabel}
                                tone={row.displayStatusTone}
                              />
                            </td>
                            <td className={`${ui.tableCell} ${styles.actionCell}`}>
                              <AppLink className={`${ui.button} ${ui.buttonSmall}`} href={row.editHref}>
                                편집
                              </AppLink>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className={ui.tableCell}>
                              <div className={styles.matchCell}>
                                <strong className={styles.primaryText}>{row.title}</strong>
                                <span className={ui.tertiary}>{row.quickSummary}</span>
                              </div>
                            </td>
                            <td className={ui.tableCell}>
                              <span className={ui.muted}>{row.venueLabel}</span>
                            </td>
                            <td className={ui.tableCell}>
                              <div className={styles.cellStack}>
                                <span>{row.dateLabel}</span>
                                <span className={ui.tertiary}>{row.timeLabel}</span>
                              </div>
                            </td>
                            <td className={ui.tableCell}>
                              <div className={styles.cellStack}>
                                <span>{row.participantCount} / {row.capacity}명</span>
                                <span className={ui.tertiary}>{row.participantPreviewLabel}</span>
                              </div>
                            </td>
                            <td className={ui.tableCell}>{row.priceLabel}</td>
                            <td className={ui.tableCell}>
                              <span className={ui.muted}>{row.levelLabel}</span>
                            </td>
                            <td className={ui.tableCell}>
                              <AdminStatusBadge
                                label={row.displayStatusLabel}
                                tone={row.displayStatusTone}
                              />
                            </td>
                            <td className={`${ui.tableCell} ${styles.actionCell}`}>
                              <div className={styles.actionCluster}>
                                <button
                                  className={`${ui.button} ${ui.buttonSmall}`}
                                  onClick={() => toggleExpandedMatch(row.id)}
                                  type="button"
                                >
                                  {isExpanded ? "접기" : "참가자 보기"}
                                </button>
                                <AppLink className={`${ui.button} ${ui.buttonSmall}`} href={row.editHref}>
                                  편집
                                </AppLink>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      {variant === "matches" ? (
                        <tr key={`${row.id}-detail`}>
                          <td className={styles.expandedCell} colSpan={8}>
                            {isExpanded ? (
                              <div className={styles.expandedPanel}>
                                <div className={styles.summaryGrid}>
                                  <article className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>운영 요약</span>
                                    <strong className={styles.summaryValue}>{row.quickSummary}</strong>
                                    <span className={ui.tertiary}>{row.occupancyLabel}</span>
                                  </article>
                                  <article className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>참가자 미리보기</span>
                                    <strong className={styles.summaryValue}>{row.participantPreviewLabel}</strong>
                                    <span className={ui.tertiary}>{row.participantLabel}</span>
                                  </article>
                                </div>

                                <div className={styles.participantBlock}>
                                  <div className={styles.participantHeader}>
                                    <div>
                                      <p className={styles.participantEyebrow}>참가자 관리</p>
                                      <h3 className={styles.participantTitle}>확정 참가자 목록</h3>
                                    </div>
                                    <span className={styles.participantMeta}>{row.participants.length}명</span>
                                  </div>

                                  {row.participants.length === 0 ? (
                                    <div className={styles.emptyParticipantState}>
                                      확정 참가자가 없습니다.
                                    </div>
                                  ) : (
                                    <div className={styles.participantList}>
                                      {row.participants.map((participant) => {
                                        const parsedLevel = parsePlayerLevelValue(participant.resolvedPlayerLevel);
                                        const selection = levelSelections[participant.userId] ?? {
                                          category: parsedLevel?.category ?? "",
                                          levelNumber: parsedLevel?.levelNumber ?? "",
                                        };

                                        return (
                                          <article className={styles.participantCard} key={participant.applicationId}>
                                            <div className={styles.participantIdentity}>
                                              <div className={styles.participantCopy}>
                                                <strong>{participant.displayName}</strong>
                                                <span className={ui.tertiary}>
                                                  {participant.genderLabel} · 현재 {participant.playerLevelLabel}
                                                </span>
                                              </div>
                                            </div>

                                            <form
                                              action={onUpdatePlayerLevel}
                                              className={styles.levelEditor}
                                            >
                                              <input name="userId" type="hidden" value={participant.userId} />
                                              <input name="levelCategory" type="hidden" value={selection.category} />
                                              <input name="levelNumber" type="hidden" value={selection.levelNumber} />

                                              <div className={styles.levelSection}>
                                                <span className={styles.levelSectionLabel}>레벨</span>
                                                <div className={styles.levelChipRow}>
                                                  {PLAYER_LEVEL_CATEGORIES.map((category) => (
                                                    <button
                                                      key={category}
                                                      className={`${styles.levelChip} ${
                                                        selection.category === category ? styles.levelChipActive : ""
                                                      }`}
                                                      onClick={() =>
                                                        updateParticipantLevelSelection(
                                                          participant.userId,
                                                          { category },
                                                          participant.resolvedPlayerLevel,
                                                        )
                                                      }
                                                      type="button"
                                                    >
                                                      {category}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>

                                              <div className={styles.levelSection}>
                                                <span className={styles.levelSectionLabel}>숫자</span>
                                                <div className={styles.levelChipRow}>
                                                  {PLAYER_LEVEL_NUMBERS.map((levelNumber) => (
                                                    <button
                                                      key={levelNumber}
                                                      className={`${styles.levelChip} ${
                                                        selection.levelNumber === levelNumber ? styles.levelChipActive : ""
                                                      }`}
                                                      onClick={() =>
                                                        updateParticipantLevelSelection(
                                                          participant.userId,
                                                          { levelNumber },
                                                          participant.resolvedPlayerLevel,
                                                        )
                                                      }
                                                      type="button"
                                                    >
                                                      {levelNumber}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>

                                              <div className={styles.levelFooter}>
                                                <span className={styles.levelPreview}>
                                                  {selection.category && selection.levelNumber
                                                    ? `${selection.category} ${selection.levelNumber}`
                                                    : "레벨을 선택해 주세요"}
                                                </span>
                                                <button
                                                  className={`${ui.button} ${ui.buttonBrand}`}
                                                  disabled={!selection.category || !selection.levelNumber || !onUpdatePlayerLevel}
                                                  type="submit"
                                                >
                                                  저장
                                                </button>
                                              </div>
                                            </form>
                                          </article>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function getMatchFilterTabs(rows: AdminMatchRow[]) {
  const today = new Date();

  return [
    { id: "all" as const, label: `전체 (${rows.length})` },
    {
      id: "open" as const,
      label: `모집 중 (${rows.filter((row) => row.status === "open" && !row.isNearClosing && !row.isSoldOut).length})`,
    },
    {
      id: "today" as const,
      label: `가까운 일정 (${rows.filter((row) => isUpcomingSoon(row, today)).length})`,
    },
    {
      id: "draft" as const,
      label: `임시 저장 (${rows.filter((row) => row.status === "draft").length})`,
    },
    {
      id: "nearClosing" as const,
      label: `마감 임박 (${rows.filter((row) => row.isNearClosing).length})`,
    },
    {
      id: "closed" as const,
      label: `마감 (${rows.filter((row) => row.status === "closed").length})`,
    },
    {
      id: "cancelled" as const,
      label: `취소 (${rows.filter((row) => row.status === "cancelled").length})`,
    },
  ];
}

function filterRows(rows: AdminMatchRow[], activeFilter: MatchFilter, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = new Date();
  const searchedRows = normalizedQuery.length > 0
    ? rows.filter(
        (row) =>
          row.title.toLowerCase().includes(normalizedQuery) ||
          row.venueLabel.toLowerCase().includes(normalizedQuery),
      )
    : rows;

  if (activeFilter === "open") {
    return sortRowsByPriority(
      searchedRows.filter((row) => row.status === "open" && !row.isNearClosing && !row.isSoldOut),
    );
  }

  if (activeFilter === "draft") {
    return sortRowsByPriority(searchedRows.filter((row) => row.status === "draft"));
  }

  if (activeFilter === "nearClosing") {
    return sortRowsByPriority(searchedRows.filter((row) => row.isNearClosing));
  }

  if (activeFilter === "today") {
    return sortRowsByPriority(searchedRows.filter((row) => isUpcomingSoon(row, now)));
  }

  if (activeFilter === "closed") {
    return sortRowsByPriority(searchedRows.filter((row) => row.status === "closed" || row.isSoldOut));
  }

  if (activeFilter === "cancelled") {
    return sortRowsByPriority(searchedRows.filter((row) => row.status === "cancelled"));
  }

  return sortRowsByPriority(searchedRows);
}

function isUpcomingSoon(row: AdminMatchRow, now: Date) {
  const matchTime = new Date(row.startAt);
  const diff = matchTime.getTime() - now.getTime();
  return diff >= -86400000 && diff <= 1000 * 60 * 60 * 24 * 3;
}

function sortRowsByPriority(rows: AdminMatchRow[]) {
  return rows.slice().sort((left, right) => {
    const priorityDiff = getRowPriority(left) - getRowPriority(right);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
  });
}

function getRowPriority(row: AdminMatchRow) {
  if (row.status === "cancelled") {
    return 5;
  }

  if (row.status === "draft") {
    return 3;
  }

  if (row.isNearClosing) {
    return 0;
  }

  if (row.status === "open") {
    return 1;
  }

  if (row.status === "closed" || row.isSoldOut) {
    return 4;
  }

  return 2;
}
