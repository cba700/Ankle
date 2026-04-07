"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useRouteTransition } from "./route-transition-provider";

type AppLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  showTransition?: boolean;
};

export function AppLink({
  href,
  onClick,
  showTransition = true,
  target,
  download,
  ...props
}: AppLinkProps) {
  const pathname = usePathname();
  const { beginTransition } = useRouteTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || !showTransition) {
      return;
    }

    if (
      target === "_blank" ||
      download ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const currentPath = `${pathname}${window.location.search}`;

    if (!shouldStartTransition(currentPath, href)) {
      return;
    }

    beginTransition(href);
  }

  return (
    <Link
      download={download}
      href={href}
      onClick={handleClick}
      target={target}
      {...props}
    />
  );
}

function shouldStartTransition(currentPath: string, href: string) {
  if (href.startsWith("#")) {
    return false;
  }

  try {
    const currentUrl = new URL(currentPath, window.location.origin);
    const nextUrl = new URL(href, window.location.origin);

    if (nextUrl.origin !== currentUrl.origin) {
      return false;
    }

    const currentRoute = `${currentUrl.pathname}${currentUrl.search}`;
    const nextRoute = `${nextUrl.pathname}${nextUrl.search}`;

    return nextRoute !== currentRoute;
  } catch {
    return false;
  }
}
