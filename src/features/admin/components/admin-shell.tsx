import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin-shell.module.css";

type AdminShellProps = {
  activeNav: "dashboard" | "matches" | "venues" | "create";
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "대시보드",
    description: "운영 현황 요약",
    href: "/admin",
  },
  {
    id: "matches",
    label: "매치 관리",
    description: "회차 목록과 수정",
    href: "/admin/matches",
  },
  {
    id: "venues",
    label: "경기장 관리",
    description: "관리 경기장 기본값",
    href: "/admin/venues",
  },
  {
    id: "create",
    label: "새 매치",
    description: "새 운영 회차 작성",
    href: "/admin/matches/new",
  },
] as const;

export function AdminShell({
  activeNav,
  eyebrow,
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <div className={styles.brand}>
              <span className={styles.brandWord}>앵클</span>
              <span className={styles.brandDot}>.</span>
            </div>
            <p className={styles.brandLabel}>Admin Console</p>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeNav;

              return (
                <Link
                  key={item.id}
                  className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                  href={item.href}
                >
                  <span>
                    <strong className={styles.navTitle}>{item.label}</strong>
                    <span className={styles.navDescription}>{item.description}</span>
                  </span>
                  <span aria-hidden="true" className={styles.navArrow}>
                    ↗
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarNote}>
            <p className={styles.sidebarNoteTitle}>현재 단계</p>
            <p className={styles.sidebarNoteText}>
              관리 경기장 기본값을 정리하고, 그 값을 바탕으로 매치를 여는 운영 콘솔입니다.
              경기장 원본과 매치 저장값은 분리해서 다룹니다.
            </p>
          </div>
        </aside>

        <main className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerCopy}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.actions}>
              <form action="/auth/signout" method="post">
                <button className={styles.signOutButton} type="submit">
                  로그아웃
                </button>
              </form>

              {actions}
            </div>
          </header>

          <div className={styles.body}>{children}</div>
        </main>
      </div>
    </div>
  );
}
