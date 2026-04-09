"use client";

import { AppLink } from "@/components/navigation/app-link";
import styles from "./legal-footer.module.css";

const LEGAL_LINKS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
] as const;

export function LegalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`pageShell ${styles.inner}`}>
        <nav aria-label="법률 및 운영 문서" className={styles.links}>
          {LEGAL_LINKS.map((link) => (
            <AppLink className={styles.link} href={link.href} key={link.href}>
              {link.label}
            </AppLink>
          ))}
        </nav>
        <p className={styles.copy}>정식 운영 문안은 추후 확정 예정입니다.</p>
      </div>
    </footer>
  );
}
