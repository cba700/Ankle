import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      alt="앵클"
      className={className}
      height={140}
      priority={priority}
      src="/brand/logo.svg"
      width={480}
    />
  );
}
