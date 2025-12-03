'use client';

import { SessionProvider } from 'next-auth/react';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ExpenseProvider>{children}</ExpenseProvider>
    </SessionProvider>
  );
}
