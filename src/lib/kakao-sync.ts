export function getKakaoSyncOAuthOptions(redirectTo: string) {
  const scopes = process.env.NEXT_PUBLIC_KAKAO_SYNC_SCOPES?.trim();
  const serviceTerms =
    process.env.NEXT_PUBLIC_KAKAO_SYNC_SERVICE_TERMS?.trim();
  const options: {
    queryParams?: Record<string, string>;
    redirectTo: string;
    scopes?: string;
  } = {
    redirectTo,
  };

  if (scopes) {
    options.scopes = scopes;
  }

  if (serviceTerms) {
    options.queryParams = {
      service_terms: serviceTerms,
    };
  }

  return options;
}
