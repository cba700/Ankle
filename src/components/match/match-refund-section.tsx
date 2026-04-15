import {
  MATCH_REFUND_POLICY_HREF,
  MATCH_REFUND_SUMMARY_ROWS,
  RAIN_REFUND_POLICY_HREF,
} from "@/lib/refund-policy";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

const REFUND_LINK_CARDS = [
  {
    description:
      "참가자 미달 무료 취소, 쿠폰 반환, 30분 무료 취소 기준까지 한 번에 확인할 수 있습니다.",
    href: MATCH_REFUND_POLICY_HREF,
    label: "매치 환불 전체 보기",
    title: "매치 환불 상세",
  },
  {
    description:
      "우천 취소, 알림톡 발송 기준, 현장 중단 시 부분 환불 방식까지 확인할 수 있습니다.",
    href: RAIN_REFUND_POLICY_HREF,
    label: "강수 환불 전체 보기",
    title: "강수 환불 상세",
  },
] as const;

export function MatchRefundSection() {
  return (
    <MatchSection collapsible defaultOpen={false} title="환불 정책">
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

        <div className={styles.refundLinkGrid}>
          {REFUND_LINK_CARDS.map((card) => (
            <section className={styles.refundLinkCard} key={card.href}>
              <h3 className={styles.refundLinkTitle}>{card.title}</h3>
              <p className={styles.refundLinkDescription}>{card.description}</p>
              <AppLink className={styles.refundLinkButton} href={card.href}>
                {card.label}
              </AppLink>
            </section>
          ))}
        </div>
      </div>
    </MatchSection>
  );
}
