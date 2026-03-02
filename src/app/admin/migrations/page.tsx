'use client';

import { Suspense } from 'react';
import MigrationsList from './MigrationsList';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-12 text-zinc-500 animate-pulse">Loading migrations...</div>}>
      <MigrationsList />
    </Suspense>
  );
}
