"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { MyPageProfile } from "@/lib/mypage";
import {
  DISPLAY_NAME_MAX_LENGTH,
  getDisplayNameValidationMessage,
} from "@/lib/signup-profile";
import { BrandLogo } from "@/components/branding/brand-logo";
import { CASH_REFUND_ELIGIBILITY_NOTICE } from "@/lib/refund-policy";
import {
  formatTemporaryLevel,
  TEMPORARY_LEVEL_OPTIONS,
  toTemporaryLevelChoice,
  type TemporaryLevelChoice,
} from "@/lib/player-preferences";
import { ArrowLeftIcon, PencilIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-settings.module.css";

type MyPageSettingsProps = {
  displayNameDraftValue: string;
  displayNameErrorMessage: string;
  displayNameValue: string;
  displayNameFormAction: (formData: FormData) => void | Promise<void>;
  initialIsAdmin: boolean;
  initialActiveDialog: DialogKind | null;
  profile: MyPageProfile;
  temporaryLevelFormAction: (formData: FormData) => void | Promise<void>;
  withdrawalPreview: WithdrawalPreview;
};

type WithdrawalPreview = {
  cashBalanceAmount: number;
  cashBalanceLabel: string;
  couponCount: number;
  futureMatchCount: number;
  pendingChargeOrderCount: number;
  pendingRefundRequestedAmountLabel: string | null;
};

type DialogKind = "accountWithdrawal" | "displayName" | "temporaryLevel";

type AccountWithdrawalSubmitResponse =
  | {
      code?: string;
      message?: string;
      ok?: boolean;
      status?: "withdrawal_pending" | "withdrawn";
    }
  | null;

export function MyPageSettings({
  displayNameDraftValue,
  displayNameErrorMessage,
  displayNameValue,
  displayNameFormAction,
  initialIsAdmin,
  initialActiveDialog,
  profile,
  temporaryLevelFormAction,
  withdrawalPreview,
}: MyPageSettingsProps) {
  const initials = profile.displayName.slice(0, 1).toUpperCase() || "A";
  const [activeDialog, setActiveDialog] = useState<DialogKind | null>(initialActiveDialog);
  const [displayNameDialogState, setDisplayNameDialogState] = useState({
    errorMessage: displayNameErrorMessage,
    value: displayNameDraftValue || displayNameValue,
  });
  const editableRows: Array<{
    dialog: DialogKind;
    key: string;
    label: string;
    value: string;
  }> = [
    {
      dialog: "displayName",
      key: "display-name",
      label: "표시 이름",
      value: profile.displayName,
    },
    {
      dialog: "temporaryLevel",
      key: "temporary-level",
      label: "임시 레벨",
      value: formatTemporaryLevel(profile.temporaryLevel),
    },
  ];
  const infoRows = [
    { label: "휴대폰 번호", value: profile.phoneNumber },
    { label: "이메일", value: profile.email },
    { label: "로그인 방식", value: profile.providerLabel },
    { label: "권한", value: getRoleLabel(profile.role) },
  ];

  useEffect(() => {
    if (!initialActiveDialog && !displayNameErrorMessage) {
      return;
    }

    window.history.replaceState(window.history.state, "", "/mypage/settings");
  }, [displayNameErrorMessage, initialActiveDialog]);

  return (
    <>
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

          <section className={styles.profileCard}>
            <span className={styles.avatar}>
              {profile.avatarUrl ? (
                <img alt="" className={styles.avatarImage} src={profile.avatarUrl} />
              ) : (
                initials
              )}
            </span>

            <div className={styles.profileCopy}>
              <p className={styles.profileEyebrow}>ACCOUNT</p>
              <h1 className={styles.pageTitle}>설정</h1>
              <p className={styles.profileDescription}>
                필요한 정보만 간단하게 관리할 수 있습니다.
              </p>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionCopy}>
                <h2 className={styles.sectionTitle}>프로필</h2>
                <p className={styles.sectionDescription}>자주 바꾸는 항목만 모았습니다.</p>
              </div>
            </div>

            <div className={styles.settingList}>
              {editableRows.map((row) => (
                <div className={styles.settingRow} key={row.key}>
                  <div className={styles.settingCopy}>
                    <span className={styles.settingLabel}>{row.label}</span>
                    <strong className={styles.settingValue}>{row.value}</strong>
                  </div>

                  <button
                    aria-haspopup="dialog"
                    className={styles.editButton}
                    onClick={() => {
                      if (row.dialog === "displayName") {
                        setDisplayNameDialogState({
                          errorMessage: "",
                          value: displayNameValue,
                        });
                      }

                      setActiveDialog(row.dialog);
                    }}
                    type="button"
                  >
                    <PencilIcon className={styles.editButtonIcon} />
                    수정
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionCopy}>
                <h2 className={styles.sectionTitle}>계정 정보</h2>
              </div>
            </div>

            <div className={styles.settingList}>
              {infoRows.map((row) => (
                <div className={`${styles.settingRow} ${styles.settingRowStatic}`} key={row.label}>
                  <div className={styles.settingCopy}>
                    <span className={styles.settingLabel}>{row.label}</span>
                    <strong className={styles.settingValue}>{row.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionCopy}>
                <h2 className={styles.sectionTitle}>계정 액션</h2>
              </div>
            </div>

            <div className={styles.actionList}>
              <form action="/auth/signout" method="post">
                <button className={styles.signOutButton} type="submit">
                  로그아웃
                </button>
              </form>

              <div className={styles.withdrawRow}>
                <button
                  className={styles.withdrawButton}
                  onClick={() => setActiveDialog("accountWithdrawal")}
                  type="button"
                >
                  회원 탈퇴
                </button>
                <span className={styles.withdrawMeta}>
                  {getWithdrawalMetaLabel(withdrawalPreview)}
                </span>
              </div>
            </div>
          </section>
        </main>

        <LegalFooter />
      </div>

      {activeDialog === "displayName" ? (
        <DisplayNameDialog
          displayNameErrorMessage={displayNameDialogState.errorMessage}
          displayNameValue={displayNameDialogState.value}
          formAction={displayNameFormAction}
          onClose={() => {
            setActiveDialog(null);
            setDisplayNameDialogState((current) => ({
              ...current,
              errorMessage: "",
            }));
          }}
        />
      ) : null}

      {activeDialog === "temporaryLevel" ? (
        <TemporaryLevelDialog
          formAction={temporaryLevelFormAction}
          initialTemporaryLevel={profile.temporaryLevel}
          onClose={() => setActiveDialog(null)}
        />
      ) : null}

      {activeDialog === "accountWithdrawal" ? (
        <AccountWithdrawalDialog
          onClose={() => setActiveDialog(null)}
          preview={withdrawalPreview}
        />
      ) : null}
    </>
  );
}

function DisplayNameDialog({
  displayNameErrorMessage,
  displayNameValue,
  formAction,
  onClose,
}: {
  displayNameErrorMessage: string;
  displayNameValue: string;
  formAction: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(displayNameValue);
  const [inlineError, setInlineError] = useState<string | null>(
    displayNameErrorMessage || null,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const displayNameError = getDisplayNameValidationMessage(displayName);

    if (displayNameError) {
      event.preventDefault();
      setInlineError(displayNameError);
      return;
    }

    setInlineError(null);
  }

  return (
    <SettingsDialog
      onClose={onClose}
      subtitle="비워두면 로그인 정보의 이름이 대신 표시됩니다."
      title="표시 이름 변경"
    >
      <form action={formAction} className={styles.modalForm} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>표시 이름</span>
          <input
            autoFocus
            className={styles.textInput}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            name="displayName"
            onChange={(event) => {
              setDisplayName(event.target.value);

              if (inlineError) {
                setInlineError(getDisplayNameValidationMessage(event.target.value));
              }
            }}
            placeholder="이름을 입력하세요"
            type="text"
            value={displayName}
          />
          <span className={styles.fieldHint}>한글, 영문, 숫자, 공백만 입력할 수 있으며 2~12자까지 가능합니다.</span>
          {inlineError ? <span className={styles.fieldError}>{inlineError}</span> : null}
        </label>

        <div className={styles.modalActionRow}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            취소
          </button>
          <button className={styles.primaryButton} type="submit">
            저장
          </button>
        </div>
      </form>
    </SettingsDialog>
  );
}

function TemporaryLevelDialog({
  formAction,
  initialTemporaryLevel,
  onClose,
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  initialTemporaryLevel: MyPageProfile["temporaryLevel"];
  onClose: () => void;
}) {
  const [selectedLevelChoice, setSelectedLevelChoice] =
    useState<TemporaryLevelChoice | null>(
      toTemporaryLevelChoice(initialTemporaryLevel),
    );

  return (
    <SettingsDialog
      onClose={onClose}
      subtitle="현재 플레이 스타일에 가장 가까운 레벨만 선택해 주세요."
      title="임시 레벨 변경"
    >
      <form action={formAction} className={styles.modalForm}>
        {selectedLevelChoice ? (
          <input
            name="temporaryLevelChoice"
            type="hidden"
            value={selectedLevelChoice}
          />
        ) : null}

        <div className={styles.levelList}>
          {TEMPORARY_LEVEL_OPTIONS.map((option) => {
            const isSelected = selectedLevelChoice === option.choice;

            return (
              <button
                aria-pressed={isSelected}
                className={`${styles.levelOption} ${isSelected ? styles.levelOptionActive : ""}`}
                key={option.choice}
                onClick={() => setSelectedLevelChoice(option.choice)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`${styles.levelMarker} ${isSelected ? styles.levelMarkerActive : ""}`}
                />
                <div className={styles.levelOptionCopy}>
                  <strong className={styles.levelOptionTitle}>{option.choice}</strong>
                  <span className={styles.levelOptionDescription}>
                    {option.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.modalActionRow}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            취소
          </button>
          <button
            className={styles.primaryButton}
            disabled={!selectedLevelChoice}
            type="submit"
          >
            저장
          </button>
        </div>
      </form>
    </SettingsDialog>
  );
}

function AccountWithdrawalDialog({
  onClose,
  preview,
}: {
  onClose: () => void;
  preview: WithdrawalPreview;
}) {
  const hasBlockingReason =
    preview.futureMatchCount > 0 || preview.pendingChargeOrderCount > 0;
  const hasPendingRefundRequest = Boolean(preview.pendingRefundRequestedAmountLabel);
  const requiresOriginalPaymentRefund =
    preview.cashBalanceAmount > 0 && !hasPendingRefundRequest;
  const [agreedToWarnings, setAgreedToWarnings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit =
    !isSubmitting &&
    !hasBlockingReason &&
    agreedToWarnings;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agreedToWarnings,
        }),
      });
      const payload =
        (await response.json().catch(() => null)) as AccountWithdrawalSubmitResponse;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(
          payload?.message ?? "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      window.location.href =
        payload.status === "withdrawn"
          ? "/login?error=account_withdrawn"
          : "/login?error=account_withdrawal_pending";
    } catch {
      setErrorMessage("회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SettingsDialog
      onClose={() => {
        if (isSubmitting) {
          return;
        }

        onClose();
      }}
      subtitle="탈퇴가 접수되면 보호 중인 기능 접근이 바로 제한됩니다."
      title="회원 탈퇴"
    >
      <div className={styles.withdrawalSummaryGrid}>
        <div className={styles.withdrawalSummaryCard}>
          <span className={styles.withdrawalSummaryLabel}>보유 캐시</span>
          <strong className={styles.withdrawalSummaryValue}>
            {hasPendingRefundRequest
              ? preview.pendingRefundRequestedAmountLabel
              : preview.cashBalanceLabel}
          </strong>
        </div>
        <div className={styles.withdrawalSummaryCard}>
          <span className={styles.withdrawalSummaryLabel}>예정 매치</span>
          <strong className={styles.withdrawalSummaryValue}>
            {preview.futureMatchCount}건
          </strong>
        </div>
        <div className={styles.withdrawalSummaryCard}>
          <span className={styles.withdrawalSummaryLabel}>보유 쿠폰</span>
          <strong className={styles.withdrawalSummaryValue}>
            {preview.couponCount}장
          </strong>
        </div>
      </div>

      <div className={styles.withdrawalNoticeList}>
        <div className={styles.withdrawalNoticeCard}>
          <strong className={styles.withdrawalNoticeTitle}>탈퇴 후 바로 적용되는 내용</strong>
          <p className={styles.withdrawalNoticeBody}>
            회원 탈퇴가 접수되면 매치 신청, 캐시 충전, 마이페이지 접근이 즉시 제한됩니다.
          </p>
        </div>
        <div className={styles.withdrawalNoticeCard}>
          <strong className={styles.withdrawalNoticeTitle}>30일 재가입 제한</strong>
          <p className={styles.withdrawalNoticeBody}>
            탈퇴 시점의 휴대폰 번호는 30일 동안 다시 가입하거나 재인증에 사용할 수 없습니다.
          </p>
        </div>
        <div className={styles.withdrawalNoticeCard}>
          <strong className={styles.withdrawalNoticeTitle}>쿠폰 처리</strong>
          <p className={styles.withdrawalNoticeBody}>
            사용하지 않은 쿠폰은 탈퇴 완료 시 함께 소멸되며 복구되지 않습니다.
          </p>
        </div>
      </div>

      {hasBlockingReason ? (
        <div className={styles.withdrawalBlockerCard}>
          <strong className={styles.withdrawalBlockerTitle}>
            먼저 정리해야 탈퇴할 수 있습니다.
          </strong>
          <div className={styles.withdrawalBlockerList}>
            {preview.futureMatchCount > 0 ? (
              <p className={styles.withdrawalBlockerItem}>
                예정된 매치 {preview.futureMatchCount}건을 먼저 취소해 주세요.
              </p>
            ) : null}
            {preview.pendingChargeOrderCount > 0 ? (
              <p className={styles.withdrawalBlockerItem}>
                미완료 충전 주문 {preview.pendingChargeOrderCount}건이 정리되어야 합니다.
              </p>
            ) : null}
          </div>
          <div className={styles.modalActionRow}>
            <button className={styles.primaryButton} onClick={onClose} type="button">
              확인
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.modalForm}>
          {hasPendingRefundRequest ? (
            <div className={styles.withdrawalInlineCard}>
              <strong className={styles.withdrawalInlineTitle}>기존 환불 요청 사용</strong>
              <p className={styles.withdrawalInlineBody}>
                이미 접수된 캐시 환불 요청 {preview.pendingRefundRequestedAmountLabel}이
                회원 탈퇴와 함께 처리됩니다.
              </p>
            </div>
          ) : null}

          {requiresOriginalPaymentRefund ? (
            <>
              <div className={styles.withdrawalInlineCard}>
                <strong className={styles.withdrawalInlineTitle}>캐시 환불 안내</strong>
                <p className={styles.withdrawalInlineBody}>
                  보유 캐시 {preview.cashBalanceLabel}는 탈퇴 처리 중 결제했던 수단으로
                  환불됩니다. {CASH_REFUND_ELIGIBILITY_NOTICE}
                </p>
              </div>
            </>
          ) : null}

          <label className={styles.checkboxField}>
            <input
              checked={agreedToWarnings}
              className={styles.checkboxInput}
              onChange={(event) => setAgreedToWarnings(event.target.checked)}
              type="checkbox"
            />
            <span className={styles.checkboxLabel}>
              위 내용을 모두 확인했고, 회원 탈퇴 이후 제한 사항에 동의합니다.
            </span>
          </label>

          {errorMessage ? <p className={styles.fieldError}>{errorMessage}</p> : null}

          <div className={styles.modalActionRow}>
            <button
              className={styles.secondaryButton}
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className={styles.primaryButton}
              disabled={!canSubmit}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting
                ? "처리 중..."
                : getAccountWithdrawalSubmitLabel(preview, hasPendingRefundRequest)}
            </button>
          </div>
        </div>
      )}
    </SettingsDialog>
  );
}

function SettingsDialog({
  children,
  onClose,
  subtitle,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
}) {
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.dialogRoot}>
      <div
        aria-hidden="true"
        className={styles.dialogBackdrop}
        onClick={onClose}
      />

      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
      >
        <div className={styles.dialogHeader}>
          <div className={styles.dialogCopy}>
            <h2 className={styles.dialogTitle} id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className={styles.dialogDescription}>{subtitle}</p>
            ) : null}
          </div>

          <button className={styles.closeButton} onClick={onClose} type="button">
            닫기
          </button>
        </div>

        {children}
      </section>
    </div>,
    document.body,
  );
}

function getRoleLabel(role: MyPageProfile["role"]) {
  return role === "admin" ? "관리자" : "일반 사용자";
}

function getWithdrawalMetaLabel(preview: WithdrawalPreview) {
  if (preview.futureMatchCount > 0) {
    return `예정 매치 ${preview.futureMatchCount}건 정리 필요`;
  }

  if (preview.pendingChargeOrderCount > 0) {
    return `미완료 충전 ${preview.pendingChargeOrderCount}건 확인 필요`;
  }

  if (preview.pendingRefundRequestedAmountLabel) {
    return "기존 환불 요청과 함께 처리";
  }

  if (preview.cashBalanceAmount > 0) {
    return "캐시 환불 후 탈퇴";
  }

  return "탈퇴 전 유의사항 확인";
}

function getAccountWithdrawalSubmitLabel(
  preview: WithdrawalPreview,
  hasPendingRefundRequest: boolean,
) {
  if (hasPendingRefundRequest) {
    return "환불 처리와 함께 탈퇴하기";
  }

  if (preview.cashBalanceAmount > 0) {
    return "환불 후 탈퇴하기";
  }

  return "탈퇴하기";
}
