import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  size?: "lg" | "md";
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  avatar,
  actions,
  size = "lg",
  className,
}: PageHeaderProps) {
  const titleClass =
    size === "md"
      ? "font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text"
      : "font-heading text-[20px] sm:text-[24px] font-extrabold text-portal-text";

  return (
    <div className={cn(size === "md" ? "mb-5" : "mb-6", className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className={avatar ? "flex items-center gap-3.5" : undefined}>
          {avatar}
          <div>
            <h1 className={titleClass}>{title}</h1>
            {subtitle && (
              <p className="text-[13px] text-portal-muted mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
}
