import type { HomeFilterGroup, HomeFilterState } from "./home-types";
import styles from "./home-filter-bar.module.css";

type HomeFilterBarProps = {
  filterState: HomeFilterState;
  groups: HomeFilterGroup[];
  onToggleHideClosed: () => void;
  onToggleOption: (groupId: "districts" | "genders" | "levels", optionId: string) => void;
};

export function HomeFilterBar({
  filterState,
  groups,
  onToggleHideClosed,
  onToggleOption,
}: HomeFilterBarProps) {
  return (
    <section className={styles.section}>
      <div className={styles.group}>
        <span className={styles.groupTitle}>빠른 필터</span>
        <div className={styles.row}>
          <button
            aria-pressed={filterState.hideClosed}
            className={`${styles.chip} ${filterState.hideClosed ? styles.chipActive : ""}`}
            onClick={onToggleHideClosed}
            type="button"
          >
            마감 가리기
          </button>
        </div>
      </div>

      {groups.map((group) => {
        const selectedValues = filterState[group.id] as readonly string[];

        return (
          <div className={styles.group} key={group.id}>
            <span className={styles.groupTitle}>{group.label}</span>
            <div className={styles.row}>
              {group.options.map((option) => {
                const isActive = selectedValues.includes(option.id);

                return (
                  <button
                    aria-pressed={isActive}
                    className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
                    key={option.id}
                    onClick={() => onToggleOption(group.id, option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
