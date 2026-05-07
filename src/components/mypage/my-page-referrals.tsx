"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowLeftIcon, CopyIcon, ShareIcon, UsersIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-referrals.module.css";

type MyPageReferralsProps = {
  initialIsAdmin: boolean;
  referralCode: string;
  referralLink: string;
};

const FAQ_ITEMS = [
  {
    answer:
      "가입 중 초대 코드를 입력했는데 쿠폰이 보이지 않으면 마이페이지의 쿠폰 목록을 새로고침한 뒤 문의해 주세요.",
    question: "포인트 미지급 관련",
  },
  {
    answer:
      "초대 링크로 들어오면 가입 화면의 초대 코드 입력칸에 코드가 자동으로 채워집니다. 직접 받은 코드는 가입 중 선택 입력할 수 있습니다.",
    question: "코드 입력 화면 안내",
  },
  {
    answer:
      "초대 코드는 가입 완료 전에만 입력할 수 있고, 본인의 코드는 사용할 수 없습니다.",
    question: "초대 코드 사용 조건",
  },
];

export function MyPageReferrals({
  initialIsAdmin,
  referralCode,
  referralLink,
}: MyPageReferralsProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedbackMessage(`${label}를 복사했어요.`);
    } catch {
      setFeedbackMessage("복사에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <BrandLogo className={baseStyles.brandLogo} priority />
          </AppLink>

          <div className={baseStyles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={initialIsAdmin}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={`pageShell ${styles.main}`}>
        <AppLink className={styles.backLink} href="/mypage">
          <ArrowLeftIcon className={styles.backIcon} />
          마이페이지로 돌아가기
        </AppLink>

        <section className={styles.summaryCard}>
          <span className={styles.summaryBadge}>
            <ShareIcon className={styles.summaryBadgeIcon} />
            친구 초대
          </span>

          <div className={styles.codePanel}>
            <p className={styles.panelLabel}>내 초대 코드</p>
            <strong className={styles.referralCode}>{referralCode}</strong>
          </div>

          <p className={styles.description}>
            친구가 내 코드로 가입하면 친구에게 2,000원 쿠폰이 지급됩니다. 내게는
            친구 초대 보상 3,000원 쿠폰이 지급됩니다.
          </p>

          <div className={styles.actionGrid}>
            <button
              className={styles.primaryButton}
              onClick={() => void handleCopy(referralLink, "초대 링크")}
              type="button"
            >
              <CopyIcon className={styles.buttonIcon} />
              링크 복사
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => void handleCopy(referralCode, "초대 코드")}
              type="button"
            >
              <CopyIcon className={styles.buttonIcon} />
              코드 복사
            </button>
          </div>

        </section>

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>Referral FAQ</p>
              <h2 className={baseStyles.sectionTitle}>자주 묻는 질문</h2>
            </div>
            <UsersIcon className={styles.sectionIcon} />
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item) => (
              <details className={styles.faqItem} key={item.question}>
                <summary className={styles.faqQuestion}>{item.question}</summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {feedbackMessage ? (
        <div className={styles.copyDialogRoot} role="presentation">
          <button
            aria-label="알림 닫기"
            className={styles.copyDialogBackdrop}
            onClick={() => setFeedbackMessage(null)}
            type="button"
          />
          <div
            aria-modal="true"
            className={styles.copyDialog}
            role="dialog"
          >
            <p className={styles.copyDialogMessage}>{feedbackMessage}</p>
            <button
              className={styles.copyDialogButton}
              onClick={() => setFeedbackMessage(null)}
              type="button"
            >
              확인
            </button>
          </div>
        </div>
      ) : null}

      <LegalFooter />
    </div>
  );
}
