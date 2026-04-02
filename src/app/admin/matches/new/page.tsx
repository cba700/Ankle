import { AdminMatchEditor } from "@/features/admin/components/admin-match-editor";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { buildAdminMatchFormValue } from "@/features/admin/view-model";

export default function AdminNewMatchPage() {
  return (
    <AdminShell
      activeNav="create"
      description="실제 저장 연결 전 단계라서, 운영자가 어떤 정보 단위로 매치를 만들지부터 안정적으로 검증하는 화면입니다."
      eyebrow="Create Match"
      title="새 매치 열기"
    >
      <AdminMatchEditor mode="create" values={buildAdminMatchFormValue()} />
    </AdminShell>
  );
}
