'use client';
import { FetchProvider } from '@ace-fetch/react';
import { fetch } from '../apis';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FetchProvider fetch={fetch}>{children}</FetchProvider>
      </body>
    </html>
  );
}
