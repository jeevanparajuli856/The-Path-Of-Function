import { Suspense } from 'react';
import ForgotPasswordSentClient from './sent-client';

export default function ForgotPasswordSentPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordSentClient />
    </Suspense>
  );
}
