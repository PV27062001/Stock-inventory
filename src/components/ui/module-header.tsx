'use client';

import { PageHeader } from '@/components/ui/page-header';

/**
 * Header for an app's main screens (its home and every bottom-nav tab): Apps at the top-left goes
 * back to the launcher, Settings is always the last button at the top-right. It is the same bar on
 * every tab, so switching tabs never changes its size. The colour is the app's `--app-bar`.
 */
export function ModuleHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return <PageHeader nav="apps" settings title={title} subtitle={subtitle} actions={right} />;
}
