import type { MatchDetailFacility } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchCourtSectionProps = {
  facilities: MatchDetailFacility[];
  notes: string[];
};

export function MatchCourtSection({
  facilities,
  notes,
}: MatchCourtSectionProps) {
  return (
    <MatchSection title="코트 정보">
      <div className={styles.facilityGrid}>
        {facilities.map((facility) => (
          <div
            className={`${styles.facilityItem} ${
              facility.available === false ? styles.facilityItemOff : ""
            }`}
            key={`${facility.key}-${facility.label}`}
          >
            <span className={styles.facilityKey}>{getFacilityKeyLabel(facility.key)}</span>
            <span>{facility.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.notesTitle}>코트 특이사항</div>
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

function getFacilityKeyLabel(key: MatchDetailFacility["key"]) {
  switch (key) {
    case "size":
      return "SZ";
    case "parking":
      return "PK";
    case "shower":
      return "SH";
    case "locker":
      return "LK";
    case "snack":
      return "SN";
    case "toilet":
      return "WC";
    default:
      return "AB";
  }
}

