import {
  createAdminHomeBannerAction,
  deleteAdminHomeBannerAction,
  updateAdminHomeBannerAction,
} from "@/features/admin/actions";
import { AdminBannerImageField } from "@/features/admin/components/admin-banner-image-field";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import { ConfirmSubmitButton } from "@/features/admin/components/confirm-submit-button";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminHomeBanners } from "@/features/admin/data";
import type { AdminHomeBannerRecord } from "@/features/admin/types";
import { formatCompactDateLabel, formatSeoulDateInput, formatSeoulTime } from "@/lib/date";
import styles from "./page.module.css";

export default async function AdminBannersPage() {
  const banners = await getAdminHomeBanners();

  return (
    <AdminShell
      activeNav="banners"
      description="홈 상단 캐러셀 배너와 클릭 이동 경로를 관리합니다."
      eyebrow="BANNERS"
      title="배너 관리"
    >
      <div className={styles.layout}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <h2 className={styles.sectionTitle}>새 배너</h2>
              <p className={styles.sectionDescription}>
                이미지는 1176 x 391 비율을 권장합니다. 링크는 /로 시작하는 내부 경로만 입력할 수 있습니다.
              </p>
            </div>
          </div>

          <div className={ui.sectionCard}>
            <form
              action={createAdminHomeBannerAction}
              className={styles.bannerForm}
              encType="multipart/form-data"
            >
              <BannerFields />
              <button className={`${ui.button} ${ui.buttonBrand}`} type="submit">
                배너 추가
              </button>
            </form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>등록된 배너</h2>
            <span className={styles.sectionMeta}>{banners.length}개</span>
          </div>

          {banners.length === 0 ? (
            <div className={ui.sectionCard}>
              <p className={ui.muted}>등록된 홈 배너가 없습니다. 배너가 없으면 기본 배너가 노출됩니다.</p>
            </div>
          ) : (
            <div className={styles.bannerList}>
              {banners.map((banner) => (
                <BannerCard banner={banner} key={banner.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function BannerCard({ banner }: { banner: AdminHomeBannerRecord }) {
  const updateAction = updateAdminHomeBannerAction.bind(null, banner.id);
  const deleteAction = deleteAdminHomeBannerAction.bind(null, banner.id);
  const status = getBannerStatus(banner);

  return (
    <div className={ui.sectionCard}>
      <div className={styles.bannerCardHeader}>
        <div className={styles.bannerCopy}>
          <div className={styles.bannerTitleRow}>
            <strong className={styles.bannerTitle}>{banner.title}</strong>
            <AdminStatusBadge label={status.label} tone={status.tone} />
          </div>
          <p className={styles.bannerMeta}>
            순서 {banner.displayOrder} · {banner.href} · {formatBannerWindowLabel(banner)}
          </p>
        </div>
      </div>

      <form action={updateAction} className={styles.bannerForm} encType="multipart/form-data">
        <BannerFields banner={banner} />
        <button className={`${ui.button} ${ui.buttonPrimary}`} type="submit">
          저장
        </button>
      </form>

      <div className={styles.bannerActionRow}>
        <p className={styles.bannerHint}>삭제하면 홈 캐러셀에서 즉시 제외됩니다.</p>
        <form action={deleteAction}>
          <ConfirmSubmitButton
            className={`${ui.button} ${styles.deleteButton}`}
            confirmationMessage="이 배너를 삭제할까요?"
          >
            삭제
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

function BannerFields({ banner }: { banner?: AdminHomeBannerRecord }) {
  return (
    <>
      <div className={`${styles.field} ${styles.fieldSpan}`}>
        <AdminBannerImageField initialUrl={banner?.imageUrl} />
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>제목</span>
        <input
          defaultValue={banner?.title ?? ""}
          name="title"
          placeholder="예: 친구초대 이벤트"
          required
          type="text"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>클릭 이동 경로</span>
        <input
          defaultValue={banner?.href ?? ""}
          name="href"
          placeholder="/events/friend-invite"
          required
          type="text"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>노출 순서</span>
        <input
          defaultValue={String(banner?.displayOrder ?? 100)}
          inputMode="numeric"
          name="displayOrder"
          type="number"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>시작 시각</span>
        <input defaultValue={formatDateTimeInput(banner?.startsAt)} name="startsAt" type="datetime-local" />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>종료 시각</span>
        <input defaultValue={formatDateTimeInput(banner?.endsAt)} name="endsAt" type="datetime-local" />
      </label>

      <label className={styles.toggleField}>
        <input defaultChecked={banner?.isActive ?? true} name="isActive" type="checkbox" />
        <span>홈에 노출</span>
      </label>
    </>
  );
}

function getBannerStatus(banner: AdminHomeBannerRecord): {
  label: string;
  tone: "accent" | "danger" | "neutral";
} {
  const now = Date.now();

  if (!banner.isActive) {
    return { label: "비활성", tone: "neutral" };
  }

  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) {
    return { label: "예약", tone: "neutral" };
  }

  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) {
    return { label: "종료", tone: "danger" };
  }

  return { label: "운영", tone: "accent" };
}

function formatBannerWindowLabel(banner: AdminHomeBannerRecord) {
  if (!banner.startsAt && !banner.endsAt) {
    return "상시 노출";
  }

  const startsAt = banner.startsAt ? formatDateTimeLabel(banner.startsAt) : "즉시";
  const endsAt = banner.endsAt ? formatDateTimeLabel(banner.endsAt) : "종료 없음";

  return `${startsAt} - ${endsAt}`;
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  return `${formatCompactDateLabel(date)} ${formatSeoulTime(date)}`;
}

function formatDateTimeInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${formatSeoulDateInput(date)}T${formatSeoulTime(date)}`;
}
