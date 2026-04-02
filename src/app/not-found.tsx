import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(100%, 560px)",
          padding: "36px",
          borderRadius: "28px",
          border: "1px solid var(--line)",
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "var(--shadow-soft)",
          textAlign: "center",
        }}
      >
        <p className="sectionLabel" style={{ margin: "0 auto 16px" }}>
          앵클
        </p>
        <h1 style={{ margin: "0 0 10px", fontSize: "32px", letterSpacing: "-0.04em" }}>
          매치를 찾을 수 없습니다
        </h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          링크가 바뀌었거나 준비 중인 매치일 수 있습니다. 메인 페이지에서 다른 날짜의
          매치를 확인해 주세요.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "160px",
            minHeight: "52px",
            borderRadius: "999px",
            background: "var(--text-primary)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          메인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
