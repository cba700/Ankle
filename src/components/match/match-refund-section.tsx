import {
  MATCH_REFUND_SECTION_ID,
  MATCH_REFUND_SUMMARY_ROWS,
  REFUND_POLICY_HREF,
  REFUND_POLICY_SECTIONS,
  RAIN_REFUND_SECTION_ID,
  type RefundPolicyGroup,
} from "@/lib/refund-policy";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

const MATCH_REFUND_SECTION =
  REFUND_POLICY_SECTIONS.find((section) => section.id === MATCH_REFUND_SECTION_ID) ?? null;
const RAIN_REFUND_SECTION =
  REFUND_POLICY_SECTIONS.find((section) => section.id === RAIN_REFUND_SECTION_ID) ?? null;
const MATCH_REFUND_PREVIEW_GROUPS = MATCH_REFUND_SECTION?.groups.slice(1) ?? [];
const MATCH_REFUND_SHORTFALL_GROUPS = MATCH_REFUND_PREVIEW_GROUPS.filter((group) =>
  isShortfallRefundGroup(group.title),
);
const MATCH_REFUND_OTHER_GROUPS = MATCH_REFUND_PREVIEW_GROUPS.filter(
  (group) => !isShortfallRefundGroup(group.title),
);
const RAIN_REFUND_PREVIEW_GROUP = RAIN_REFUND_SECTION?.groups[0] ?? null;

export function MatchRefundSection() {
  return (
    <MatchSection collapsible defaultOpen title="환불 정책">
      <div className={styles.refundLayout}>
        <div className={styles.refundSummaryCard}>
          <div className={styles.refundCardLabel}>소셜 매치 취소 환불 규정</div>
          <div className={styles.refundTable}>
            {MATCH_REFUND_SUMMARY_ROWS.map((row) => (
              <div className={styles.refundRow} key={`${row.condition}-${row.policy}`}>
                <span className={styles.refundCondition}>{row.condition}</span>
                <strong className={styles.refundPolicy}>{row.policy}</strong>
              </div>
            ))}
          </div>
        </div>

        {MATCH_REFUND_SHORTFALL_GROUPS.length > 0 ? (
          <CombinedRefundPolicyPreviewBlock groups={MATCH_REFUND_SHORTFALL_GROUPS} />
        ) : null}

        {MATCH_REFUND_OTHER_GROUPS.map((group) => (
          <RefundPolicyPreviewBlock group={group} key={group.title} />
        ))}

        {RAIN_REFUND_PREVIEW_GROUP ? (
          <RefundPolicyPreviewBlock group={RAIN_REFUND_PREVIEW_GROUP} />
        ) : null}

        <div className={styles.refundLinkGrid}>
          <AppLink
            className={styles.refundLinkButton}
            href={REFUND_POLICY_HREF}
            rel="noopener noreferrer"
            target="_blank"
          >
            환불정책 전체 보기
          </AppLink>
        </div>
      </div>
    </MatchSection>
  );
}

function RefundPolicyPreviewBlock({
  group,
}: {
  group: RefundPolicyGroup;
}) {
  return (
    <section className={styles.refundPolicyBlock}>
      <h3 className={styles.refundLinkTitle}>{group.title}</h3>

      {group.rows ? (
        <div className={styles.refundTable}>
          {group.rows.map((row) => (
            <div className={styles.refundRow} key={`${group.title}-${row.condition}-${row.policy}`}>
              <span className={styles.refundCondition}>{row.condition}</span>
              <strong className={styles.refundPolicy}>{row.policy}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {group.items ? (
        <ul className={styles.bulletList}>
          {group.items.map((item) => (
            <li className={styles.bulletItem} key={`${group.title}-${item}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CombinedRefundPolicyPreviewBlock({
  groups,
}: {
  groups: RefundPolicyGroup[];
}) {
  const [shortfallCancelGroup, shortfallCriteriaGroup] = groups;

  return (
    <section className={`${styles.refundPolicyBlock} ${styles.refundPolicyBlockHighlight}`}>
      <div className={styles.refundCardLabel}>
        {shortfallCancelGroup?.title ?? "참가자 미달 무료 취소"}
      </div>

      {shortfallCancelGroup?.rows ? (
        <div className={styles.refundTable}>
          {shortfallCancelGroup.rows.map((row) => (
            <div
              className={styles.refundRow}
              key={`${shortfallCancelGroup.title}-${row.condition}-${row.policy}`}
            >
              <span className={styles.refundCondition}>{row.condition}</span>
              <strong className={styles.refundPolicy}>{row.policy}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {shortfallCriteriaGroup?.rows ? (
        <div className={styles.refundInlineBlock}>
          <p className={styles.refundInlineLabel}>{shortfallCriteriaGroup.title}</p>
          <div className={styles.refundTable}>
            {shortfallCriteriaGroup.rows.map((row) => (
              <div
                className={styles.refundRow}
                key={`${shortfallCriteriaGroup.title}-${row.condition}-${row.policy}`}
              >
                <span className={styles.refundCondition}>{row.condition}</span>
                <strong className={styles.refundPolicy}>{row.policy}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function isShortfallRefundGroup(title: string) {
  return title === "참가자 미달 무료 취소" || title === "참가자 미달 기준";
}
