import { useState } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  alt?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  fallbackClassName,
  alt = "DevLens",
}: BrandLogoProps) {
  const theme = useThemeStore((state) => state.theme);
  const [failedSources, setFailedSources] = useState<Record<string, boolean>>({});
  const src = theme === "light" ? "/devlens-light-logo.png" : "/devlens-logo.png";
  const imageUnavailable = failedSources[src] ?? false;

  return (
    <div className={cn("flex items-center", className)}>
      {imageUnavailable ? (
        <div className={cn("flex flex-col", fallbackClassName)}>
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            DevLens
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Engineering Intelligence Platform
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("block h-auto max-w-full", imageClassName)}
          onError={() => setFailedSources((previous) => ({ ...previous, [src]: true }))}
        />
      )}
    </div>
  );
}