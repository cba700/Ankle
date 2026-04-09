import Link from "next/link";
import { LegalFooter } from "./legal-footer";
import styles from "./legal-document.module.css";

export type LegalDocumentSection = {
  body: string[];
  title: string;
};

type LegalDocumentProps = {
  lead: string;
  notice: string;
  sections: LegalDocumentSection[];
  title: string;
  updatedAtLabel: string;
};

export function LegalDocument({
  lead,
  notice,
  sections,
  title,
  updatedAtLabel,
}: LegalDocumentProps) {
  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <Link className={styles.backLink} href="/">
            앵클 홈으로 돌아가기
          </Link>

          <article className={styles.document}>
            <p className={styles.eyebrow}>Legal</p>
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.lead}>{lead}</p>
              </div>
              <dl className={styles.metaList}>
                <div className={styles.metaItem}>
                  <dt>문서 상태</dt>
                  <dd>자리표시자</dd>
                </div>
                <div className={styles.metaItem}>
                  <dt>최종 업데이트</dt>
                  <dd>{updatedAtLabel}</dd>
                </div>
              </dl>
            </div>

            <section className={styles.noticeBox}>
              <strong>정식 문안 준비 중</strong>
              <p>{notice}</p>
            </section>

            <div className={styles.sectionList}>
              {sections.map((section) => (
                <section className={styles.section} key={section.title}>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  <div className={styles.sectionBody}>
                    {section.body.map((paragraph) => (
                      <p className={styles.paragraph} key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </main>
      </div>
      <LegalFooter />
    </div>
  );
}
