import type { Metadata } from "next";
import { LegalFooter } from "@/components/legal/legal-footer";
import { REFUND_POLICY_SECTIONS } from "@/lib/refund-policy";
import styles from "./refund-page.module.css";

export const metadata: Metadata = {
  title: "환불규정",
  description: "앵클 매치 환불, 강수 취소, 참가자 미달 기준 안내",
  robots: {
    follow: true,
    index: true,
  },
};

export default function RefundPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Refund Policy</p>
          <h1 className={styles.title}>환불규정</h1>
          <p className={styles.description}>
            매치 취소, 강수 취소, 참가자 미달 기준을 한 곳에서 확인할 수 있습니다.
          </p>

          <nav aria-label="환불규정 바로가기" className={styles.jumpNav}>
            {REFUND_POLICY_SECTIONS.map((section) => (
              <a className={styles.jumpLink} href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </header>

        <div className={styles.sectionList}>
          {REFUND_POLICY_SECTIONS.map((section) => (
            <section className={styles.policySection} id={section.id} key={section.id}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionDescription}>{section.description}</p>
              </div>

              <div className={styles.groupList}>
                {section.groups.map((group) => (
                  <div className={styles.groupCard} key={`${section.id}-${group.title}`}>
                    <h3 className={styles.groupTitle}>{group.title}</h3>

                    {group.rows ? (
                      <div className={styles.policyTable}>
                        {group.rows.map((row) => (
                          <div
                            className={styles.policyRow}
                            key={`${section.id}-${group.title}-${row.condition}-${row.policy}`}
                          >
                            <span className={styles.policyCondition}>{row.condition}</span>
                            <strong className={styles.policyResult}>{row.policy}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {group.items ? (
                      <ul className={styles.policyList}>
                        {group.items.map((item) => (
                          <li className={styles.policyItem} key={`${section.id}-${group.title}-${item}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
