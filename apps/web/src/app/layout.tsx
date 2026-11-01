import type { ReactNode } from 'react';
export default function RootLayout({ children }: { children: ReactNode }) {
 return <html lang="vi"><body style={{fontFamily:'Arial, sans-serif',margin:0,background:'#f8fafc',color:'#111827'}}>{children}</body></html>;
}
