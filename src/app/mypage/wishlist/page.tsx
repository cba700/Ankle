import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageWishlist } from "@/components/mypage/my-page-wishlist";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getServerAuthState } from "@/lib/supabase/auth";
import { listWishlistMatchesByUserId } from "@/lib/wishlist";

export const metadata: Metadata = {
  title: "관심 매치",
  description: "앵클에서 저장한 관심 매치 목록",
};

export const dynamic = "force-dynamic";

export default async function MyPageWishlistRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/wishlist",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const matches = await listWishlistMatchesByUserId(user.id);

  return (
    <MyPageWishlist
      initialIsAdmin={role === "admin"}
      matches={matches}
    />
  );
}
