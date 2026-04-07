import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchSafetySectionProps = {
  items: string[];
};

export function MatchSafetySection({ items }: MatchSafetySectionProps) {
  return (
    <MatchSection collapsible defaultOpen={false} title="안전 유의사항">
      <ul className={styles.bulletList}>
        {items.map((item) => (
          <li className={styles.bulletItem} key={item}>
            {item}
          </li>
        ))}
      </ul>
    </MatchSection>
  );
}
