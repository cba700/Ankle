import {
  approveCashRefundRequestAction,
  adjustAdminCashBalanceAction,
  rejectCashRefundRequestAction,
  retryPendingCashChargeOrderAction,
} from "@/features/admin/actions";
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
  buildAdminCashChargeOrderEventRows,
  buildAdminCashOverviewCards,
  buildAdminCashRefundRequestRows,
  buildAdminCashTransactionRows,
} from "@/features/admin/view-model";
import styles from "./page.module.css";

export default async function AdminCashPage() {
  const data = await getAdminCashDashboardData();
  const withdrawalLinkedRefundRequestIds = new Set(
    data.linkedWithdrawalRefundRequestIds,
  );
  const overviewCards = buildAdminCashOverviewCards(data);
  const accountRows = buildAdminCashAccountRows(data.accounts);
  const transactionRows = buildAdminCashTransactionRows(data.transactions);
  const chargeOrderRows = buildAdminCashChargeOrderRows(data.chargeOrders);
  const chargeOrderEventRows = buildAdminCashChargeOrderEventRows(
    data.chargeOrderEvents,
  );
  const refundRequestRows = buildAdminCashRefundRequestRows(data.refundRequests);

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
            <h2 className={styles.sectionTitle}>수동 캐시 보정</h2>
            <span className={styles.sectionMeta}>장애 복구 / CS 대응용</span>
          </div>
          <div className={ui.sectionCard}>
            <form action={adjustAdminCashBalanceAction} className={styles.adjustForm}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>사용자 ID</span>
                <input name="userId" placeholder="UUID" required type="text" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>증감 금액</span>
                <input name="amount" placeholder="예: 5000 또는 -5000" required type="number" />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.fieldLabel}>사유</span>
                <input name="memo" placeholder="예: 승인 누락 복구, CS 보정" required type="text" />
              </label>
              <button className={`${ui.button} ${ui.buttonBrand}`} type="submit">
                캐시 보정 반영
              </button>
            </form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>환불 신청</h2>
            <span className={styles.sectionMeta}>{refundRequestRows.length}건</span>
          </div>
          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHeadCell}>신청 시각</th>
                    <th className={ui.tableHeadCell}>구분</th>
                    <th className={ui.tableHeadCell}>사용자</th>
                    <th className={ui.tableHeadCell}>금액</th>
                    <th className={ui.tableHeadCell}>은행</th>
                    <th className={ui.tableHeadCell}>계좌번호</th>
                    <th className={ui.tableHeadCell}>예금주</th>
                    <th className={ui.tableHeadCell}>상태</th>
                    <th className={ui.tableHeadCell}>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {refundRequestRows.length === 0 ? (
                    <tr>
                      <td className={ui.tableCell} colSpan={9}>
                        표시할 환불 신청이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    refundRequestRows.map((row, index) => (
                      <tr key={row.id} className={ui.tableRow}>
                        <td className={ui.tableCell}>{row.metaLabel}</td>
                        <td className={ui.tableCell}>
                          {withdrawalLinkedRefundRequestIds.has(row.id)
                            ? "회원 탈퇴"
                            : "일반 환불"}
                        </td>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.userId}</span>
                        </td>
                        <td className={ui.tableCell}>{row.requestedAmountLabel}</td>
                        <td className={ui.tableCell}>{row.bankName}</td>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.accountNumber}</span>
                        </td>
                        <td className={ui.tableCell}>{row.accountHolder}</td>
                        <td className={ui.tableCell}>
                          <AdminStatusBadge label={row.statusLabel} tone={row.statusTone} />
                        </td>
                        <td className={ui.tableCell}>
                          {data.refundRequests[index]?.status === "pending" ? (
                            <div className={styles.actionCluster}>
                              <form action={approveCashRefundRequestAction}>
                                <input name="requestId" type="hidden" value={row.id} />
                                <button
                                  className={`${ui.button} ${ui.buttonBrand} ${ui.buttonSmall}`}
                                  type="submit"
                                >
                                  {withdrawalLinkedRefundRequestIds.has(row.id)
                                    ? "승인 후 탈퇴 완료"
                                    : "승인"}
                                </button>
                              </form>
                              <form action={rejectCashRefundRequestAction}>
                                <input name="requestId" type="hidden" value={row.id} />
                                <button
                                  className={`${ui.button} ${ui.buttonSmall}`}
                                  type="submit"
                                >
                                  {withdrawalLinkedRefundRequestIds.has(row.id)
                                    ? "반려 후 탈퇴 취소"
                                    : "반려"}
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className={ui.tertiary}>처리 완료</span>
                          )}
                        </td>
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
                    chargeOrderRows.map((row, index) => (
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
                        <td className={ui.tableCell}>
                          <div className={styles.metaBlock}>
                            <span>{row.metaLabel}</span>
                            <span>paymentKey {row.paymentKeyLabel}</span>
                            <span>{row.detailLabel}</span>
                            {data.chargeOrders[index]?.status === "pending" ? (
                              <form
                                action={retryPendingCashChargeOrderAction}
                                className={styles.retryForm}
                              >
                                <input name="orderId" type="hidden" value={row.orderId} />
                                <button
                                  className={`${ui.button} ${ui.buttonSmall} ${styles.retryButton}`}
                                  type="submit"
                                >
                                  정식 승인 재시도
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </td>
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
            <h2 className={styles.sectionTitle}>최근 결제 이벤트</h2>
            <span className={styles.sectionMeta}>{chargeOrderEventRows.length}건</span>
          </div>
          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHeadCell}>이벤트</th>
                    <th className={ui.tableHeadCell}>주문 ID</th>
                    <th className={ui.tableHeadCell}>처리 결과</th>
                    <th className={ui.tableHeadCell}>메타</th>
                  </tr>
                </thead>
                <tbody>
                  {chargeOrderEventRows.length === 0 ? (
                    <tr>
                      <td className={ui.tableCell} colSpan={4}>
                        표시할 결제 이벤트가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    chargeOrderEventRows.map((row) => (
                      <tr key={row.id} className={ui.tableRow}>
                        <td className={ui.tableCell}>{row.eventType}</td>
                        <td className={ui.tableCell}>
                          <span className={styles.code}>{row.orderId}</span>
                        </td>
                        <td className={ui.tableCell}>{row.processedResultLabel}</td>
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
