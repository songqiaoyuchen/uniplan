import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import "../styles/globals.css";
import JoyNavbar from "./components/layout/Navbar";
import Toolbar from "@mui/material/Toolbar";
import Providers from '@components/Providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppRouterCacheProvider>
          <Providers>
            <JoyNavbar/>
            <Toolbar/> {/* for spacing */}
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
