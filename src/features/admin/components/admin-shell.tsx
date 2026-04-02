import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin-shell.module.css";

type AdminShellProps = {
  activeNav: "dashboard" | "matches" | "create";
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
              이 관리자 화면은 공개 메인/상세와 분리된 목업입니다. 운영 플로우와 정보
              구조를 먼저 검증하는 용도입니다.
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
