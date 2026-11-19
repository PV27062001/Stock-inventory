'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Settings, type LucideIcon } from 'lucide-react';

/**
 * The one style for every button on the coloured top bar (SPEC §5 "Top-bar buttons"): 48px tall,
 * a visible white outline, a 24px icon AND a word, so it is easy to see and to understand.
 * `danger` is a solid white button with red text for delete.
 */
export const headerButtonClass = (danger = false) =>
  `inline-flex h-12 min-w-12 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-base font-bold transition-all active:scale-95 disabled:opacity-60 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:shrink-0 ${
    danger
      ? 'bg-white text-[hsl(0_72%_45%)] hover:bg-white/90'
      : 'bg-white/20 text-white ring-1 ring-inset ring-white/40 hover:bg-white/30'
  }`;

type HeaderButtonProps = {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
};

export function HeaderButton({ icon: Icon, label, href, onClick, danger, disabled, title }: HeaderButtonProps) {
  const content = (
    <>
      <Icon aria-hidden />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={headerButtonClass(danger)} title={title}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={headerButtonClass(danger)} title={title}>
      {content}
    </button>
  );
}

/** Always top-left. Goes to `href` when given, otherwise one page back (or home when there is no history). */
export function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  const goBack = () => {
    if (href) router.push(href);
    else if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };
  return <HeaderButton icon={ChevronLeft} label="Back" onClick={goBack} />;
}

/** Always top-right on the main screens (home and every bottom-nav tab). */
export function SettingsButton() {
  return <HeaderButton icon={Settings} label="Settings" href="/settings" />;
}

/**
 * Header for every screen that is not a bottom-nav tab: Back on the left, the screen's own buttons
 * on the right, and the title on its own line underneath so long names and several buttons always
 * fit at phone width. `children` (such as filter chips) stay pinned inside the bar.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  actions,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={`sticky top-0 z-20 bg-[hsl(var(--app-bar))] px-4 pb-3 pt-2 text-white shadow-elevated ${className}`}>
      <div className="mx-auto max-w-md">
        <div className="flex min-h-12 items-center gap-2">
          <BackButton href={backHref} />
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
        <div className="mt-2 min-w-0">
          {subtitle && <p className="text-sm font-semibold text-white/80">{subtitle}</p>}
          <h1 className="truncate text-xl font-bold leading-tight">{title}</h1>
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  );
}
