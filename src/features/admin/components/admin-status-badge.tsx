import type { AdminMatchStatus } from "../types";
import { getAdminStatusMeta } from "../view-model";
import styles from "./admin-status-badge.module.css";

export function AdminStatusBadge({ status }: { status: AdminMatchStatus }) {
  const meta = getAdminStatusMeta(status);

  return (
    <span className={`${styles.badge} ${styles[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
