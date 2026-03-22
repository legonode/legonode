import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import Image from "next/image";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <div className="bg-muted size-10 animate-pulse rounded-full" />;
  }
  return (
    <div className="flex items-center gap-2">
      <Image
        src={"/logo.png"}
        alt="Logo"
        width={100}
        height={100}
        className="size-8"
      />
      <p className="flex items-center text-sm font-bold">
        <span className="text-foreground">Lego</span>
        <span className="text-primary">node</span>
      </p>
    </div>
  );
};

export default Logo;
