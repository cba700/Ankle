import { AppLink } from "@/components/navigation/app-link";
import { WelcomeStepper } from "@/components/welcome/welcome-stepper";
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
      <main className={styles.main}>
        <AppLink className={styles.brand} href="/">
          <span className={styles.brandWord}>앵클</span>
          <span className={styles.brandDot}>.</span>
        </AppLink>

        <WelcomeStepper
          action={formAction}
          initialPreferredTimeSlots={initialPreferredTimeSlots}
          initialPreferredWeekdays={initialPreferredWeekdays}
          initialTemporaryLevel={initialTemporaryLevel}
          nextPath={nextPath}
        />
      </main>
    </div>
  );
}
