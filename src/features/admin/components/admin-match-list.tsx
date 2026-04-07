"use client";

import { useState } from "react";
import { AppLink } from "@/components/navigation/app-link";
import type { AdminMatchRow } from "../types";
import { AdminStatusBadge } from "./admin-status-badge";
import ui from "./admin-ui.module.css";
import styles from "./admin-match-list.module.css";

type AdminMatchListProps = {
  rows: AdminMatchRow[];
  variant: "dashboard" | "matches";
  title?: string;
};

type MatchFilter = "all" | "open" | "draft" | "nearClosing";

export function AdminMatchList({
  rows,
  variant,
  title,
}: AdminMatchListProps) {
  const [activeFilter, setActiveFilter] = useState<MatchFilter>("all");
  const tabs = getMatchFilterTabs(rows);
  const filteredRows = variant === "matches" ? filterRows(rows, activeFilter) : rows;

  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}

      {variant === "matches" ? (
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
                filteredRows.map((row) => (
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
                          <strong className={styles.primaryText}>{row.title}</strong>
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
                            <span>
                              {row.participantCount} / {row.capacity}명
                            </span>
                            <span className={ui.tertiary}>{row.occupancyLabel}</span>
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
                          <AppLink className={`${ui.button} ${ui.buttonSmall}`} href={row.editHref}>
                            편집
                          </AppLink>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function getMatchFilterTabs(rows: AdminMatchRow[]) {
  return [
    { id: "all" as const, label: `전체 (${rows.length})` },
    {
      id: "open" as const,
      label: `모집 중 (${rows.filter((row) => row.status === "open" && !row.isNearClosing).length})`,
    },
    {
      id: "draft" as const,
      label: `임시 저장 (${rows.filter((row) => row.status === "draft").length})`,
    },
    {
      id: "nearClosing" as const,
      label: `마감 임박 (${rows.filter((row) => row.isNearClosing).length})`,
    },
  ];
}

function filterRows(rows: AdminMatchRow[], activeFilter: MatchFilter) {
  if (activeFilter === "open") {
    return rows.filter((row) => row.status === "open" && !row.isNearClosing);
  }

  if (activeFilter === "draft") {
    return rows.filter((row) => row.status === "draft");
  }

  if (activeFilter === "nearClosing") {
    return rows.filter((row) => row.isNearClosing);
  }

  return rows;
}
