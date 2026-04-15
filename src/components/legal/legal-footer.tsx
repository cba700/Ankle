"use client";

import { AppLink } from "@/components/navigation/app-link";
import styles from "./legal-footer.module.css";

const LEGAL_LINKS = [
  { href: "/terms", label: "이용약관", newTab: true },
  { href: "/privacy", label: "개인정보처리방침", newTab: true },
  { href: "/refund", label: "환불규정", newTab: true },
  { href: "/business-info", label: "사업자정보확인", newTab: false },
] as const;

export function LegalFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`pageShell ${styles.inner}`}>
        <nav aria-label="법률 및 운영 문서" className={styles.links}>
          {LEGAL_LINKS.map((link) => (
            <AppLink
              className={styles.link}
              href={link.href}
              key={link.href}
              rel={link.newTab ? "noopener noreferrer" : undefined}
              target={link.newTab ? "_blank" : undefined}
            >
              {link.label}
            </AppLink>
          ))}
        </nav>

        <section aria-labelledby="business-info-title" className={styles.businessInfo}>
          <h2 className={styles.businessTitle} id="business-info-title">
          </h2>
          <p className={styles.businessLine}>
            앵클베스킷 | 서울특별시 도봉구 해등로 50 311-1301 | 010-2354-0467
          </p>
          <p className={styles.businessLine}>대표: 남강현</p>
          <p className={styles.businessLine}>메일: anklebasket@naver.com</p>
          <p className={styles.businessLine}>사업자등록번호: 679-74-00694</p>
          <p className={styles.businessLine}>통신판매업신고: 미기재</p>
        </section>
      </div>
    </footer>
  );
}
