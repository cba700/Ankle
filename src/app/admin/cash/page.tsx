import { AdminOverviewCards } from "@/features/admin/components/admin-overview-cards";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import ui from "@/features/admin/components/admin-ui.module.css";
import {
  getAdminCashDashboardData,
} from "@/features/admin/data";
import {
  buildAdminCashAccountRows,
  buildAdminCashChargeOrderRows,
  buildAdminCashOverviewCards,
  buildAdminCashTransactionRows,
} from "@/features/admin/view-model";
import styles from "./page.module.css";

export default async function AdminCashPage() {
  const data = await getAdminCashDashboardData();
  const overviewCards = buildAdminCashOverviewCards(data);
  const accountRows = buildAdminCashAccountRows(data.accounts);
  const transactionRows = buildAdminCashTransactionRows(data.transactions);
  const chargeOrderRows = buildAdminCashChargeOrderRows(data.chargeOrders);

  return (
    <AdminShell
      activeNav="cash"
      eyebrow="CASH OPS"
      title="캐시 현황"
    >
      <div className={styles.layout}>
        <AdminOverviewCards items={overviewCards} />

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 캐시 원장</h2>
            <span className={styles.sectionMeta}>{transactionRows.length}건</span>
          </div>
          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHeadCell}>거래</th>
                    <th className={ui.tableHeadCell}>사용자</th>
                    <th className={ui.tableHeadCell}>금액</th>
                    <th className={ui.tableHeadCell}>잔액</th>
                    <th className={ui.tableHeadCell}>메타</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionRows.length === 0 ? (
                    <tr>
                      <td className={ui.tableCell} colSpan={5}>
                        표시할 캐시 원장이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    transactionRows.map((row) => (
                      <tr key={row.id} className={ui.tableRow}>
                        <td className={ui.tableCell}>{row.title}</td>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.userId}</span>
                        </td>
                        <td className={ui.tableCell}>
                          <AdminStatusBadge label={row.amountLabel} tone={row.tone} />
                        </td>
                        <td className={ui.tableCell}>{row.balanceLabel}</td>
                        <td className={ui.tableCell}>{row.metaLabel}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 충전 주문</h2>
            <span className={styles.sectionMeta}>{chargeOrderRows.length}건</span>
          </div>
          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHeadCell}>주문 ID</th>
                    <th className={ui.tableHeadCell}>사용자</th>
                    <th className={ui.tableHeadCell}>금액</th>
                    <th className={ui.tableHeadCell}>상태</th>
                    <th className={ui.tableHeadCell}>메타</th>
                  </tr>
                </thead>
                <tbody>
                  {chargeOrderRows.length === 0 ? (
                    <tr>
                      <td className={ui.tableCell} colSpan={5}>
                        표시할 충전 주문이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    chargeOrderRows.map((row) => (
                      <tr key={row.id} className={ui.tableRow}>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.orderId}</span>
                        </td>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.userId}</span>
                        </td>
                        <td className={ui.tableCell}>{row.amountLabel}</td>
                        <td className={ui.tableCell}>
                          <AdminStatusBadge label={row.statusLabel} tone={row.statusTone} />
                        </td>
                        <td className={ui.tableCell}>{row.metaLabel}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>사용자 잔액</h2>
            <span className={styles.sectionMeta}>{accountRows.length}명</span>
          </div>
          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHeadCell}>사용자</th>
                    <th className={ui.tableHeadCell}>현재 잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {accountRows.length === 0 ? (
                    <tr>
                      <td className={ui.tableCell} colSpan={2}>
                        표시할 잔액 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    accountRows.map((row) => (
                      <tr key={row.userId} className={ui.tableRow}>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.userId}</span>
                        </td>
                        <td className={ui.tableCell}>{row.balanceLabel}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
