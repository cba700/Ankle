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
import type { AdminCouponTemplateRow } from "@/features/admin/types";
import styles from "./page.module.css";

export default async function AdminCouponsPage() {
  const data = await getAdminCouponDashboardData();
  const overviewCards = buildAdminCouponOverviewCards(data.templates);
  const templateRows = buildAdminCouponTemplateRows(data.templates);
  const activeRows = templateRows.filter((row) => row.isActive);
  const templateLibraryRows = templateRows.filter((row) => !row.isActive);

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
            <h2 className={styles.sectionTitle}>운영 중인 쿠폰</h2>
            <span className={styles.sectionMeta}>{activeRows.length}개</span>
          </div>

          {activeRows.length === 0 ? (
            <div className={ui.sectionCard}>
              <p className={ui.muted}>운영 중인 쿠폰이 없습니다. 아래 템플릿에서 활성화해 주세요.</p>
            </div>
          ) : (
            <div className={styles.templateList}>
              {activeRows.map((row) => (
                <CouponTemplateCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <h2 className={styles.sectionTitle}>새 쿠폰 템플릿</h2>
              <p className={styles.sectionDescription}>
                기본 신규가입 쿠폰은 미리 등록됩니다. 템플릿을 활성화하면 이후 가입자에게 다른 활성 쿠폰과
                함께 자동 지급됩니다.
              </p>
            </div>
          </div>
          <div className={ui.sectionCard}>
            <form action={createAdminCouponTemplateAction} className={styles.templateForm}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>쿠폰명</span>
                <input
                  defaultValue="신규가입 첫 매치 쿠폰"
                  name="name"
                  placeholder="예: 오픈 기념 5,000원 할인"
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
                <input name="isActive" type="checkbox" />
                <span>추가 후 바로 운영</span>
              </label>
              <button className={`${ui.button} ${ui.buttonBrand}`} type="submit">
                템플릿 추가
              </button>
            </form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>쿠폰 템플릿</h2>
            <span className={styles.sectionMeta}>{templateLibraryRows.length}개</span>
          </div>

          {templateLibraryRows.length === 0 ? (
            <div className={ui.sectionCard}>
              <p className={ui.muted}>운영 중인 쿠폰 외에 저장된 템플릿이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.templateList}>
              {templateLibraryRows.map((row) => (
                <CouponTemplateCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function CouponTemplateCard({ row }: { row: AdminCouponTemplateRow }) {
  return (
    <div className={ui.sectionCard}>
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
          <span>운영</span>
        </label>
        <button className={`${ui.button} ${ui.buttonPrimary}`} type="submit">
          저장
        </button>
      </form>
    </div>
  );
}
