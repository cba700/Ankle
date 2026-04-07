import type { ReactNode } from "react";
import { AppLink } from "@/components/navigation/app-link";
import {
  BadgeIcon,
  BasketIcon,
  CalendarIcon,
  MapPinIcon,
  WalletIcon,
} from "@/components/icons";
import styles from "./admin-shell.module.css";

type AdminShellProps = {
  activeNav: "dashboard" | "matches" | "venues" | "cash" | "create";
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "대시보드",
    href: "/admin",
    icon: BadgeIcon,
  },
  {
    id: "matches",
    label: "매치 관리",
    href: "/admin/matches",
    icon: CalendarIcon,
  },
  {
    id: "venues",
    label: "경기장 관리",
    href: "/admin/venues",
    icon: MapPinIcon,
  },
  {
    id: "cash",
    label: "캐시 현황",
    href: "/admin/cash",
    icon: WalletIcon,
  },
  {
    id: "create",
    label: "새 매치",
    href: "/admin/matches/new",
    icon: BasketIcon,
  },
] as const;

export function AdminShell({
  activeNav,
  eyebrow,
  title,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <AppLink className={styles.brand} href="/">
              <span className={styles.brandWord}>앵클</span>
              <span className={styles.brandDot}>.</span>
            </AppLink>
            <p className={styles.brandLabel}>ADMIN CONSOLE</p>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeNav;
              const Icon = item.icon;

              return (
                <AppLink
                  key={item.id}
                  className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                  href={item.href}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                </AppLink>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <form action="/auth/signout" method="post">
              <button className={styles.signOutButton} type="submit">
                로그아웃
              </button>
            </form>
          </div>
        </aside>

        <main className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerCopy}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
            </div>

            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </header>

          <div className={styles.body}>{children}</div>
        </main>
      </div>
    </div>
  );
}
