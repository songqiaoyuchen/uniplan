"use client";

import { useThemeMode } from "@/providers/ThemeProvider";
import Button from "@mui/material/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { mode } = useThemeMode();

  return (
    <Link href={href}>
      <Button
        sx={{
          color: isActive
            ? mode == "light"
              ? "secondary.main"
              : "primary.light"
            : "primary.contrastText",
          bgcolor: "transparent",
          borderRadius: 2,
          px: 2,
          py: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {children}
      </Button>
    </Link>
  );
}
