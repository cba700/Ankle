"use client";

import { useState } from "react";
import styles from "./page.module.css";

type BannerScheduleFieldsProps = {
  endsAt: string;
  startsAt: string;
};

export function BannerScheduleFields({ endsAt, startsAt }: BannerScheduleFieldsProps) {
  const [alwaysVisible, setAlwaysVisible] = useState(!startsAt && !endsAt);

  return (
    <div className={`${styles.scheduleField} ${styles.fieldSpan}`}>
      <div className={styles.scheduleHeader}>
        <span className={styles.fieldLabel}>노출 기간</span>
        <label className={styles.toggleField}>
          <input
            checked={alwaysVisible}
            name="alwaysVisible"
            onChange={(event) => setAlwaysVisible(event.target.checked)}
            type="checkbox"
          />
          <span>항상</span>
        </label>
      </div>

      <div className={`${styles.scheduleInputs} ${alwaysVisible ? styles.scheduleMuted : ""}`}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>시작 시각</span>
          <input
            defaultValue={startsAt}
            disabled={alwaysVisible}
            name="startsAt"
            required={!alwaysVisible}
            type="datetime-local"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>종료 시각</span>
          <input
            defaultValue={endsAt}
            disabled={alwaysVisible}
            name="endsAt"
            required={!alwaysVisible}
            type="datetime-local"
          />
        </label>
      </div>
    </div>
  );
}
