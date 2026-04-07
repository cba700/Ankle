import type { CSSProperties, HTMLAttributes } from "react";
import styles from "./skeleton.module.css";

type SkeletonBlockProps = HTMLAttributes<HTMLSpanElement> & {
  circle?: boolean;
  tone?: "default" | "strong";
};

export function SkeletonBlock({
  circle = false,
  className = "",
  style,
  tone = "default",
  ...props
}: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.block} ${styles[tone]} ${circle ? styles.circle : ""} ${className}`.trim()}
      style={style as CSSProperties | undefined}
      {...props}
    />
  );
}
