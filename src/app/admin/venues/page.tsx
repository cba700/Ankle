import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminVenueList } from "@/features/admin/components/admin-venue-list";
import ui from "@/features/admin/components/admin-ui.module.css";
import { getAdminVenues } from "@/features/admin/data";
import { buildAdminVenueRows } from "@/features/admin/view-model";

export default async function AdminVenuesPage() {
  const rows = buildAdminVenueRows(await getAdminVenues());

  return (
    <AdminShell
      activeNav="venues"
      actions={
        <Link className={`${ui.button} ${ui.buttonBrand}`} href="/admin/venues/new">
          + 새 경기장 추가
        </Link>
      }
      eyebrow="VENUES"
      title="경기장 관리"
    >
      <AdminVenueList rows={rows} />
    </AdminShell>
  );
}
