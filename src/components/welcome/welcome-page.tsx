import { ProfilePreferencesForm } from "@/components/profile/profile-preferences-form";
import { AppLink } from "@/components/navigation/app-link";
import type {
  PreferredTimeSlot,
  PreferredWeekday,
  TemporaryLevel,
} from "@/lib/player-preferences";
import styles from "./welcome-page.module.css";

type WelcomePageProps = {
  formAction: (formData: FormData) => void | Promise<void>;
  initialPreferredTimeSlots: PreferredTimeSlot[];
  initialPreferredWeekdays: PreferredWeekday[];
  initialTemporaryLevel: TemporaryLevel | null;
  nextPath: string;
};

export function WelcomePage({
  formAction,
  initialPreferredTimeSlots,
  initialPreferredWeekdays,
  initialTemporaryLevel,
  nextPath,
}: WelcomePageProps) {
  return (
    <div className={styles.page}>
      <main className={`pageShell ${styles.main}`}>
        <div className={styles.topRow}>
          <AppLink className={styles.brand} href="/">
            <span className={styles.brandWord}>앵클</span>
            <span className={styles.brandDot}>.</span>
          </AppLink>
        </div>

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>WELCOME</span>
            <h1 className={styles.title}>앵클 비스킷에 오신 걸 환영해요</h1>
            <p className={styles.description}>
              첫 설정은 1분 안에 끝납니다. 실력과 선호 시간을 먼저 알려주시면
              이후 매치 탐색과 알림이 훨씬 자연스러워집니다.
            </p>
          </div>

          <div className={styles.heroAside}>
            <strong className={styles.heroAsideTitle}>설정 안내</strong>
            <p className={styles.heroAsideText}>
              임시 레벨은 지금 선택한 값으로 저장되고, 실제 매치 참여 후 운영
              기준에 따라 정식 레벨로 조정됩니다.
            </p>
          </div>
        </section>

        <section className={styles.formCard}>
          <ProfilePreferencesForm
            action={formAction}
            initialPreferredTimeSlots={initialPreferredTimeSlots}
            initialPreferredWeekdays={initialPreferredWeekdays}
            initialTemporaryLevel={initialTemporaryLevel}
            nextPath={nextPath}
            submitLabel="설정 완료"
            subtitle="임시 레벨은 필수이며, 선호 요일과 시간대는 비워둔 채로 저장할 수도 있습니다."
            title="내 플레이 설정"
          />
        </section>
      </main>
    </div>
  );
}
