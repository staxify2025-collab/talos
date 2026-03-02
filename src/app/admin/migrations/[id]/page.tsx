import { Suspense } from 'react';
import MigrationController from './MigrationController';

export function generateStaticParams() {
  return [{ id: 'test' }];
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading Migration Controller...</div>}>
      <MigrationController />
    </Suspense>
  );
}
