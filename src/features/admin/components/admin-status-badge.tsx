import type { AdminBadgeTone, AdminMatchStatus } from "../types";
import { getAdminBadgeMeta } from "../view-model";
import styles from "./admin-status-badge.module.css";

export function AdminStatusBadge({
  status,
  label,
  tone,
}: {
  status?: AdminMatchStatus;
  label?: string;
  tone?: AdminBadgeTone;
}) {
  const meta = getAdminBadgeMeta({ status, label, tone });

  return (
    <span className={`${styles.badge} ${styles[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
