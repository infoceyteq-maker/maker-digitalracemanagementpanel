import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  priority?: boolean;
  /** Fill the nearest positioned parent (use with a sized wrapper). */
  fill?: boolean;
  sizes?: string;
}

export default function BrandLogo({ className = '', priority = false, fill = false, sizes = '180px' }: BrandLogoProps) {
  if (fill) {
    return (
      <Image
        src="/brand/logo.png"
        alt="Umbrella Art Cafe — Ella"
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${className}`}
      />
    );
  }
  return (
    <Image
      src="/brand/logo.png"
      alt="Umbrella Art Cafe — Ella"
      width={1240}
      height={750}
      sizes={sizes}
      priority={priority}
      className={`h-auto w-auto ${className}`}
    />
  );
}
