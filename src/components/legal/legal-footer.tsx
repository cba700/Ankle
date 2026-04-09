"use client";

import { AppLink } from "@/components/navigation/app-link";
import styles from "./legal-footer.module.css";

const LEGAL_LINKS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
] as const;

const BUSINESS_INFO_FIELDS = [
  "상호",
  "주소",
  "대표",
  "메일",
  "사업자등록번호",
  "통신판매업신고",
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

        <section aria-labelledby="business-info-title" className={styles.businessCard}>
          <h2 className={styles.businessTitle} id="business-info-title">
            사업자 정보
          </h2>
          <div className={styles.businessGrid}>
            {BUSINESS_INFO_FIELDS.map((field) => (
              <div className={styles.businessItem} key={field}>
                <span className={styles.businessLabel}>{field}</span>
                <div aria-hidden="true" className={styles.businessValue} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </footer>
  );
}
