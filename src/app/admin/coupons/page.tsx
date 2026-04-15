import {
  createAdminCouponTemplateAction,
  updateAdminCouponTemplateAction,
} from "@/features/admin/actions";
import { AdminOverviewCards } from "@/features/admin/components/admin-overview-cards";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminCouponDashboardData } from "@/features/admin/data";
import {
  buildAdminCouponOverviewCards,
  buildAdminCouponTemplateRows,
} from "@/features/admin/view-model";
import styles from "./page.module.css";

export default async function AdminCouponsPage() {
  const data = await getAdminCouponDashboardData();
  const overviewCards = buildAdminCouponOverviewCards(data.templates);
  const templateRows = buildAdminCouponTemplateRows(data.templates);

  return (
    <AdminShell
      activeNav="coupons"
      eyebrow="COUPONS"
      title="쿠폰 관리"
    >
      <div className={styles.layout}>
        <AdminOverviewCards items={overviewCards} />

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>신규가입 쿠폰 추가</h2>
            <span className={styles.sectionMeta}>가입 시 자동 지급</span>
          </div>
          <div className={ui.sectionCard}>
            <form action={createAdminCouponTemplateAction} className={styles.templateForm}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>쿠폰명</span>
                <input
                  defaultValue="신규가입 할인 쿠폰"
                  name="name"
                  placeholder="예: 신규가입 5,000원 할인"
                  required
                  type="text"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>할인 금액</span>
                <input
                  defaultValue="5000"
                  min="1"
                  name="discountAmount"
                  placeholder="예: 5000"
                  required
                  step="1"
                  type="number"
                />
              </label>
              <label className={styles.toggleField}>
                <input defaultChecked name="isActive" type="checkbox" />
                <span>즉시 활성화</span>
              </label>
              <button className={`${ui.button} ${ui.buttonBrand}`} type="submit">
                쿠폰 추가
              </button>
            </form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>템플릿 목록</h2>
            <span className={styles.sectionMeta}>{templateRows.length}개</span>
          </div>

          {templateRows.length === 0 ? (
            <div className={ui.sectionCard}>
              <p className={ui.muted}>등록된 쿠폰 템플릿이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.templateList}>
              {templateRows.map((row) => (
                <div className={ui.sectionCard} key={row.id}>
                  <div className={styles.templateCardHeader}>
                    <div className={styles.templateCopy}>
                      <div className={styles.templateNameRow}>
                        <strong className={styles.templateName}>{row.name}</strong>
                        <AdminStatusBadge label={row.statusLabel} tone={row.statusTone} />
                      </div>
                      <p className={styles.templateMeta}>{row.metaLabel}</p>
                    </div>
                    <strong className={styles.templateAmount}>{row.discountAmountLabel}</strong>
                  </div>

                  <div className={styles.templateStats}>
                    <span className={styles.statPill}>발급 {row.issuedCountLabel}</span>
                    <span className={styles.statPill}>사용 가능 {row.availableCountLabel}</span>
                    <span className={styles.statPill}>사용 완료 {row.usedCountLabel}</span>
                  </div>

                  <form action={updateAdminCouponTemplateAction} className={styles.templateForm}>
                    <input name="templateId" type="hidden" value={row.id} />
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>쿠폰명</span>
                      <input defaultValue={row.name} name="name" required type="text" />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>할인 금액</span>
                      <input
                        defaultValue={String(row.discountAmount)}
                        min="1"
                        name="discountAmount"
                        required
                        step="1"
                        type="number"
                      />
                    </label>
                    <label className={styles.toggleField}>
                      <input defaultChecked={row.isActive} name="isActive" type="checkbox" />
                      <span>활성</span>
                    </label>
                    <button className={`${ui.button} ${ui.buttonPrimary}`} type="submit">
                      저장
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
