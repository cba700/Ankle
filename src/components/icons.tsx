type IconProps = {
  className?: string;
};

function IconBase({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "icon"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M7.5 2.8v3.4M16.5 2.8v3.4M3.5 9.3h17" />
    </IconBase>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v4.7l3 1.8" />
    </IconBase>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 20c4.2-5.1 6.3-8.5 6.3-11.2A6.3 6.3 0 1 0 5.7 8.8C5.7 11.5 7.8 14.9 12 20Z" />
      <circle cx="12" cy="8.7" r="2.2" />
    </IconBase>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6.8 18.5c.5-2.4 2.5-3.8 5.2-3.8s4.7 1.4 5.2 3.8" />
      <circle cx="12" cy="9" r="3.2" />
      <path d="M4 17.7c.2-1.4 1.2-2.6 2.8-3.2M20 17.7c-.2-1.4-1.2-2.6-2.8-3.2" />
    </IconBase>
  );
}

export function BadgeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M8 4.8h8l2.6 2.6v4.1c0 4.4-2.7 7-6.6 8.8-3.9-1.8-6.6-4.4-6.6-8.8V7.4L8 4.8Z" />
      <path d="m9.5 12 1.6 1.7 3.3-3.6" />
    </IconBase>
  );
}

export function GenderIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="9" r="3.4" />
      <path d="M9 12.4V20M6 17h6M14.5 4.8h4.8v4.8M19.3 4.8l-5.2 5.2" />
    </IconBase>
  );
}

export function BasketIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 4.6c1.8 2.2 2.7 4.7 2.7 7.4s-.9 5.2-2.7 7.4M15.8 4.6c-1.8 2.2-2.7 4.7-2.7 7.4s.9 5.2 2.7 7.4M3.7 12h16.6M6.1 7.2h11.8M6.1 16.8h11.8" />
    </IconBase>
  );
}

export function ShoeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M5 16.8c3.1-.2 5.5-1 7.2-2.3 1.6-1.2 2.4-2.9 2.5-5.1h1.8c.4 1.9 1.6 3.2 3.5 3.9v3.5H5v-0Z" />
      <path d="M7.8 13.5h.1M10.1 12.7h.1M12.3 11.2h.1" />
    </IconBase>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M8.8 10.9 15.2 7.6M8.8 13.1l6.4 3.3" />
    </IconBase>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="8" y="8" width="11" height="11" rx="2.2" />
      <path d="M5.5 15.2h-.7a2.3 2.3 0 0 1-2.3-2.3V4.8a2.3 2.3 0 0 1 2.3-2.3h8.1A2.3 2.3 0 0 1 15.2 4.8v.7" />
    </IconBase>
  );
}

export function HeartIcon({
  className,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "icon"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 20.2 4.5 12.8a4.7 4.7 0 0 1 0-6.6 4.6 4.6 0 0 1 6.5 0L12 7.2l1-1a4.6 4.6 0 0 1 6.5 0 4.7 4.7 0 0 1 0 6.6L12 20.2Z" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19c.8-3 3.3-4.8 6.5-4.8s5.7 1.8 6.5 4.8" />
    </IconBase>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M2.8 12s3.2-5.7 9.2-5.7S21.2 12 21.2 12s-3.2 5.7-9.2 5.7S2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </IconBase>
  );
}
