'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/app/brand-loader';
import { withAuth } from '@/components/Auth/with-auth';
import { readStartPage, startPath } from '@/hooks/use-start-page';

/** `/` is only an entry point: it opens the app chosen in Settings → Start screen, else the launcher. */
function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(startPath(readStartPage()));
  }, [router]);

  return <BrandLoader />;
}

export default withAuth(HomePage);
