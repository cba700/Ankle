import type { ReactNode } from "react";
import styles from "./legal-document.module.css";

type LegalDocumentProps = {
  children?: ReactNode;
  effectiveDate?: string;
  title: string;
};

export function LegalDocument({
  children,
  effectiveDate,
  title,
}: LegalDocumentProps) {
  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <article className={styles.document}>
            <header className={styles.header}>
              <h1 className={styles.title}>{title}</h1>
              {effectiveDate ? (
                <p className={styles.effectiveDate}>시행일 {effectiveDate}</p>
              ) : null}
            </header>

            <div className={styles.content}>{children}</div>
          </article>
        </main>
      </div>
    </div>
  );
}
