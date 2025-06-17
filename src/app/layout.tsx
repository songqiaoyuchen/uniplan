import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import "@/styles/globals.css";
import Navbar from "@components/layout/Navbar";
import Toolbar from "@mui/material/Toolbar";
import Providers from '@providers/Providers'

export const metadata: Metadata = {
  title: "Uniplan",
  description: "NUS Course Planning Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <Navbar />
            <Toolbar /> {/* Spacer for fixed AppBar */}
              {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
