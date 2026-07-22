'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-rosegold-400 text-sm font-semibold animate-pulse">
        Redirecting to Unified SPY Salon Login Portal...
      </div>
    </div>
  );
}
