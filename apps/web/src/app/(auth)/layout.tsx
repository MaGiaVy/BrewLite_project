import React from 'react';
import { AuthLayoutShell } from '../../components/auth/AuthForms';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
