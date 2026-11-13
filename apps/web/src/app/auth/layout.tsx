import React from 'react';
import { AuthLayoutShell } from '../../components/auth/AuthForms';

export default function AuthPrefixLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
