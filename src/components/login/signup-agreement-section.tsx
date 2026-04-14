"use client";

import { AppLink } from "@/components/navigation/app-link";
import type { SignupAgreementValues } from "@/lib/signup-profile";
import styles from "./login-page.module.css";

type SignupAgreementSectionProps = {
  disabled?: boolean;
  onChange: (nextValues: SignupAgreementValues) => void;
  value: SignupAgreementValues;
};

const AGREEMENT_ITEMS: Array<{
  description?: string;
  key: keyof SignupAgreementValues;
  label: string;
  linkHref?: string;
  required: boolean;
}> = [
  {
    description: "입력한 생년월일 기준으로 확인합니다.",
    key: "ageOver16",
    label: "만 16세 이상입니다",
    required: true,
  },
  {
    key: "privacy",
    label: "개인정보 수집 동의",
    linkHref: "/privacy",
    required: true,
  },
  {
    key: "terms",
    label: "이용약관 동의",
    linkHref: "/terms",
    required: true,
  },
  {
    key: "marketingProfile",
    label: "개인정보 마케팅 활용 동의",
    linkHref: "/privacy",
    required: false,
  },
  {
    key: "marketingSms",
    label: "이벤트 및 맞춤 정보 문자 동의",
    required: false,
  },
] as const;

export function SignupAgreementSection({
  disabled = false,
  onChange,
  value,
}: SignupAgreementSectionProps) {
  const allChecked = Object.values(value).every(Boolean);

  function handleToggleAll(checked: boolean) {
    onChange({
      ageOver16: checked,
      marketingProfile: checked,
      marketingSms: checked,
      privacy: checked,
      terms: checked,
    });
  }

  function handleToggleItem(
    key: keyof SignupAgreementValues,
    checked: boolean,
  ) {
    onChange({
      ...value,
      [key]: checked,
    });
  }

  return (
    <section className={styles.agreementSection}>
      <div className={styles.agreementHeader}>
        <span className={styles.fieldLabel}>약관 동의</span>
        <label className={`${styles.agreementRow} ${styles.agreementRowStrong}`}>
          <input
            checked={allChecked}
            className={styles.agreementCheckbox}
            disabled={disabled}
            onChange={(event) => handleToggleAll(event.target.checked)}
            type="checkbox"
          />
          <span className={styles.agreementLabel}>전체 동의</span>
        </label>
      </div>

      <div className={styles.agreementList}>
        {AGREEMENT_ITEMS.map((item) => (
          <div className={styles.agreementRow} key={item.key}>
            <label className={styles.agreementToggle}>
              <input
                checked={value[item.key]}
                className={styles.agreementCheckbox}
                disabled={disabled}
                onChange={(event) => handleToggleItem(item.key, event.target.checked)}
                type="checkbox"
              />
              <span className={styles.agreementCopy}>
                <span className={styles.agreementLabel}>
                  {item.label}
                  <span className={styles.agreementRequired}>
                    {item.required ? " (필수)" : " (선택)"}
                  </span>
                </span>
                {item.description ? (
                  <span className={styles.agreementMeta}>{item.description}</span>
                ) : null}
              </span>
            </label>
            {item.linkHref ? (
              <AppLink
                aria-label={`${item.label} 문서를 새 탭에서 열기`}
                className={styles.agreementLink}
                href={item.linkHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                {">"}
              </AppLink>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
