import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LegalDocument } from "@/components/legal/legal-document";
import styles from "@/components/legal/legal-document.module.css";

type DataRow = {
  label: string;
  value: ReactNode;
};

const PROCESSING_PURPOSE_ROWS: DataRow[] = [
  {
    label: "회원 가입 및 관리",
    value:
      "회원 식별·인증, 가입 의사 확인, 회원자격 유지·관리, 서비스 부정이용 방지",
  },
  {
    label: "매치 신청 및 운영",
    value: "매치 참가 신청·확정, 레벨 배정·관리, 현장 참가자 확인",
  },
  {
    label: "결제 및 환불 처리",
    value: "참가비 결제·정산, 취소 및 환불 처리",
  },
  {
    label: "고객 상담 및 민원 처리",
    value: "문의·불만 접수 및 처리, 분쟁 조정",
  },
  {
    label: "서비스 개선 및 마케팅",
    value: "서비스 이용 통계 분석, 신규 서비스 개발, 이벤트·공지 안내 (동의한 경우에 한함)",
  },
];

const RETENTION_ROWS: DataRow[] = [
  {
    label: "계약·청약철회·대금결제 기록",
    value: "전자상거래법 · 5년",
  },
  {
    label: "소비자 불만·분쟁처리 기록",
    value: "전자상거래법 · 3년",
  },
  {
    label: "접속 로그·접속 IP 기록",
    value: "통신비밀보호법 · 3개월",
  },
  {
    label: "표시·광고 기록",
    value: "전자상거래법 · 6개월",
  },
];

const TRUSTEE_ROWS: DataRow[] = [
  {
    label: "토스 페이먼츠",
    value: "결제 처리 및 결제 정보 관리 · 위탁 계약 종료 시까지",
  },
  {
    label: "[문자발송업체명 기재]",
    value: "알림문자(SMS/카카오) 발송 · 위탁 계약 종료 시까지",
  },
];

const SAFETY_MEASURE_ROWS: DataRow[] = [
  {
    label: "관리적 조치",
    value: "내부 관리 계획 수립·시행, 직원 정기 교육",
  },
  {
    label: "기술적 조치",
    value:
      "개인정보 처리시스템 접근 권한 관리, 접속기록 보관·위변조 방지, 개인정보 암호화(비밀번호, 결제정보 등), 보안 프로그램 설치 및 갱신",
  },
  {
    label: "물리적 조치",
    value: "전산실 및 자료 보관실 접근 통제",
  },
];

const PRIVACY_OFFICER_ROWS: DataRow[] = [
  {
    label: "성명",
    value: "임창인",
  },
  {
    label: "직책",
    value: "개발자",
  },
  {
    label: "이메일",
    value: "anklebasket@naver.com",
  },
  {
    label: "전화번호",
    value: "010-5560-2754",
  },
];

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "앵클베스킷 개인정보처리방침",
  robots: {
    follow: true,
    index: true,
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument effectiveDate="2026년 3월 10일" title="앵클베스킷 개인정보처리방침">
      <p>
        앵클베스킷(이하 &quot;회사&quot;)은 「개인정보 보호법」 제30조에 따라 정보주체의
        개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이
        개인정보 처리방침을 수립·공개합니다.
      </p>

      <section>
        <h2>제1조 (개인정보의 처리 목적)</h2>
        <p>
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적
          이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」
          제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.
        </p>
        <DataGrid rows={PROCESSING_PURPOSE_ROWS} />
      </section>

      <section>
        <h2>제2조 (처리하는 개인정보의 항목)</h2>
        <h3>① 필수 수집 항목</h3>
        <ul>
          <li>회원가입 시: 이름, 휴대폰 번호, 이메일 주소, 생년월일, 성별</li>
          <li>매치 신청 시: 신청 이력, 참가 매치 정보, 레벨 정보</li>
          <li>결제 시: 결제수단 정보(카드사명, 카드번호 일부), 결제 내역</li>
        </ul>

        <h3>② 선택 수집 항목</h3>
        <ul>
          <li>마케팅 수신 동의 시: 이메일 주소, 휴대폰 번호</li>
        </ul>

        <h3>③ 서비스 이용 과정에서 자동 수집되는 항목</h3>
        <ul>
          <li>접속 IP 주소, 쿠키, 서비스 이용 기록, 접속 기기 정보, 앱 버전 정보</li>
        </ul>

        <p>
          결제 관련 민감 정보(카드 전체 번호, CVC 등)는 회사가 직접 수집·보관하지 않으며,
          PG사(결제대행사)를 통해 처리됩니다.
        </p>
      </section>

      <section>
        <h2>제3조 (개인정보의 처리 및 보유 기간)</h2>
        <p>
          회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 동의받은 기간
          내에서만 개인정보를 처리·보유합니다.
        </p>

        <h3>① 회원 탈퇴 시</h3>
        <p>
          탈퇴 즉시 파기합니다. 단, 아래 관계 법령에 따라 일정 기간 보존합니다.
        </p>

        <h3>② 관계 법령에 따른 보존 항목 및 기간</h3>
        <DataGrid rows={RETENTION_ROWS} />
      </section>

      <section>
        <h2>제4조 (개인정보의 제3자 제공)</h2>
        <p>
          회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적 범위를 초과하여 제3자에게
          제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.
        </p>
        <ul>
          <li>정보주체가 사전에 동의한 경우</li>
          <li>
            법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의
            요구가 있는 경우
          </li>
        </ul>
        <p>
          현재 회사는 개인정보를 제3자에게 제공하지 않습니다. 향후 제공이 필요한 경우
          제공받는 자, 제공 목적, 제공 항목, 보유 기간을 사전에 고지하고 동의를 받겠습니다.
        </p>
      </section>

      <section>
        <h2>제5조 (개인정보 처리의 위탁)</h2>
        <p>
          회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 위탁하고
          있습니다.
        </p>
        <DataGrid rows={TRUSTEE_ROWS} />
        <div className={styles.note}>
          <p>
            실제 계약 업체 확정 후 업체명을 기재하세요. 수탁업체가 추가되면 이 방침을
            업데이트해야 합니다.
          </p>
        </div>
        <p>
          회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외
          개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독,
          손해배상 등의 책임에 관한 사항을 계약서에 명시하고 수탁자가 개인정보를 안전하게
          처리하는지 감독합니다.
        </p>
      </section>

      <section>
        <h2>제6조 (개인정보의 파기절차 및 방법)</h2>
        <p>
          회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 된
          경우에는 지체없이 해당 개인정보를 파기합니다.
        </p>

        <h3>① 파기절차</h3>
        <p>
          불필요한 개인정보 및 개인정보 파일은 개인정보 보호책임자의 책임 하에 파기합니다.
          법령에 따라 보존해야 하는 경우 별도의 데이터베이스(DB)로 이동하여 보존 기간 종료 후
          파기합니다.
        </p>

        <h3>② 파기방법</h3>
        <ul>
          <li>전자적 파일 형태: 복원이 불가능한 방법으로 영구 삭제</li>
          <li>종이 문서 형태: 분쇄 또는 소각</li>
        </ul>
      </section>

      <section>
        <h2>제7조 (인터넷 접속정보파일(쿠키)의 설치·운영 및 거부)</h2>
        <h3>① 쿠키 사용 목적</h3>
        <p>
          회사는 이용자에게 맞춤 서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는
          &apos;쿠키(cookie)&apos;를 사용합니다.
        </p>

        <h3>② 쿠키 설정 거부 방법</h3>
        <p>이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
        <ul>
          <li>Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
          <li>Safari: 환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터 차단</li>
          <li>모바일 앱의 경우: 기기 설정 → 앱 권한에서 조정 가능</li>
        </ul>
        <p>
          쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>제8조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h2>
        <h3>① 정보주체의 권리</h3>
        <p>정보주체는 회사에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>

        <h3>② 권리 행사 방법</h3>
        <p>
          위 권리 행사는 서비스 내 &apos;내 정보 관리&apos; 메뉴 또는 고객센터(이메일·서면)를 통해
          하실 수 있으며, 회사는 이에 대해 지체 없이(10일 이내) 조치합니다.
        </p>

        <h3>③ 법정대리인의 권리</h3>
        <p>
          만 14세 미만 아동의 법정대리인은 해당 아동의 개인정보에 대해 열람, 정정·삭제, 처리
          정지를 요구할 수 있습니다. 현재 서비스는 만 14세 미만은 가입이 제한됩니다.
        </p>

        <h3>④ 유의사항</h3>
        <p>
          정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요청한 경우에는 처리가 완료될
          때까지 해당 개인정보를 이용하거나 제공하지 않습니다.
        </p>
      </section>

      <section>
        <h2>제9조 (개인정보의 안전성 확보 조치)</h2>
        <p>
          회사는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한
          기술적·관리적·물리적 조치를 하고 있습니다.
        </p>
        <DataGrid rows={SAFETY_MEASURE_ROWS} />
      </section>

      <section>
        <h2>제10조 (가명정보의 처리)</h2>
        <p>
          회사는 현재 가명정보를 처리하지 않습니다. 향후 통계 작성, 과학적 연구, 공익적 기록
          보존 등의 목적으로 가명정보를 처리할 경우, 「개인정보 보호법」 제28조의2에 따라
          별도로 고지합니다.
        </p>
      </section>

      <section>
        <h2>제11조 (개인정보 보호책임자)</h2>
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄하고 개인정보 처리와 관련한 정보주체의 불만
          처리 및 피해 구제 등을 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <DataGrid rows={PRIVACY_OFFICER_ROWS} />
        <p>
          정보주체는 서비스 이용 과정에서 발생하는 모든 개인정보 보호 관련 문의, 불만 처리,
          피해 구제 등에 관한 사항을 개인정보 보호책임자에게 문의할 수 있습니다. 회사는
          정보주체의 문의에 지체 없이 답변 및 처리합니다.
        </p>

        <h3>기타 개인정보 침해에 대한 신고·상담</h3>
        <ul className={styles.contactList}>
          <li className={styles.contactItem}>
            개인정보 분쟁조정위원회: www.kopico.go.kr / 1833-6972
          </li>
          <li className={styles.contactItem}>
            개인정보 침해신고센터: privacy.kisa.or.kr / 118
          </li>
          <li className={styles.contactItem}>
            대검찰청 사이버수사과: www.spo.go.kr / 1301
          </li>
          <li className={styles.contactItem}>
            경찰청 사이버수사국: ecrm.cyber.go.kr / 182
          </li>
        </ul>
      </section>

      <section>
        <h2>부칙</h2>
        <p>
          본 방침은 2026년 3월 10일부터 시행합니다. 개인정보 처리방침이 변경되는 경우 시행
          7일 전부터 서비스 내 공지사항을 통해 안내합니다. 정보주체에게 불리한 변경의 경우
          30일 전부터 고지합니다.
        </p>
      </section>
    </LegalDocument>
  );
}

function DataGrid({ rows }: { rows: DataRow[] }) {
  return (
    <div className={styles.dataGrid}>
      {rows.map((row) => (
        <div className={styles.dataRow} key={row.label}>
          <span className={styles.dataLabel}>{row.label}</span>
          <p className={styles.dataValue}>{row.value}</p>
        </div>
      ))}
    </div>
  );
}
