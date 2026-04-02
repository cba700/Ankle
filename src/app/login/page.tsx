import type { Metadata } from "next";
import { LoginPage } from "@/components/login/login-page";

export const metadata: Metadata = {
  title: "로그인 | 앵클",
  description: "앵클 카카오 로그인 화면",
};

export default function Login() {
  return <LoginPage />;
}
