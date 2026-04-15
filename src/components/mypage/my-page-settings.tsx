"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { MyPageProfile } from "@/lib/mypage";
import {
  DISPLAY_NAME_MAX_LENGTH,
  getDisplayNameValidationMessage,
} from "@/lib/signup-profile";
import { BrandLogo } from "@/components/branding/brand-logo";
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
};

type DialogKind = "displayName" | "temporaryLevel";

export function MyPageSettings({
  displayNameDraftValue,
  displayNameErrorMessage,
  displayNameValue,
  displayNameFormAction,
  initialIsAdmin,
  initialActiveDialog,
  profile,
  temporaryLevelFormAction,
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
                <button className={styles.withdrawButton} disabled type="button">
                  회원 탈퇴
                </button>
                <span className={styles.withdrawMeta}>준비 중</span>
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
