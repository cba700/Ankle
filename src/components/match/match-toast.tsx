import type { MatchToastTone } from "./match-detail-types";
import styles from "./match-toast.module.css";

type MatchToastProps = {
  message: string;
  tone: MatchToastTone;
};

export function MatchToast({ message, tone }: MatchToastProps) {
  return (
    <div
      className={`${styles.toast} ${
        tone === "success"
          ? styles.toastSuccess
          : tone === "accent"
            ? styles.toastAccent
            : styles.toastDefault
      }`}
    >
      {message}
    </div>
  );
}

