import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchCourtNotesSectionProps = {
  notes: string[];
};

export function MatchCourtNotesSection({
  notes,
}: MatchCourtNotesSectionProps) {
  return (
    <MatchSection title="코트 특이사항">
      <ul className={styles.noteList}>
        {notes.map((note) => (
          <li className={styles.noteItem} key={note}>
            {note}
          </li>
        ))}
      </ul>
    </MatchSection>
  );
}
