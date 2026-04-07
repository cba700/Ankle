type SupabasePublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type SupabaseServiceEnv = SupabasePublicEnv & {
  serviceRoleKey: string;
};

type TossPaymentsPublicEnv = {
  clientKey: string;
};

type TossPaymentsServerEnv = TossPaymentsPublicEnv & {
  secretKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function getSupabaseServiceEnv(): SupabaseServiceEnv | null {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnv || !serviceRoleKey) {
    return null;
  }

  return {
    ...publicEnv,
    serviceRoleKey,
  };
}

export function getTossPaymentsPublicEnv(): TossPaymentsPublicEnv | null {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  if (!clientKey) {
    return null;
  }

  return {
    clientKey,
  };
}

export function getTossPaymentsServerEnv(): TossPaymentsServerEnv | null {
  const publicEnv = getTossPaymentsPublicEnv();
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!publicEnv || !secretKey) {
    return null;
  }

  return {
    ...publicEnv,
    secretKey,
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicEnv());
}

export function isTossPaymentsConfigured() {
  return Boolean(getTossPaymentsServerEnv());
}
