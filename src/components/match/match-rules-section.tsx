import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchRulesSectionProps = {
  rules: string[];
  howTo: string[];
};

export function MatchRulesSection({ rules, howTo }: MatchRulesSectionProps) {
  return (
    <MatchSection collapsible defaultOpen title="매치 진행 방식">
      <div className={styles.subTitle}>매치 규칙</div>
      <ul className={styles.bulletList}>
        {rules.map((rule) => (
          <li className={styles.bulletItem} key={rule}>
            {rule}
          </li>
        ))}
      </ul>

      <div className={styles.subTitle}>진행 방식</div>
      <ul className={styles.bulletList}>
        {howTo.map((item) => (
          <li className={styles.bulletItem} key={item}>
            {item}
          </li>
        ))}
      </ul>
    </MatchSection>
  );
}

