import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Logo = ({
  iconOnly = false,
  isLink = true,
}: {
  iconOnly?: boolean;
  isLink?: boolean;
}) => {
  const pathname = usePathname();
  const link = isLink ? "/" : pathname;
  return (
    <Link href={link} className="flex items-center gap-2">
      <Image
        src={"/logo.png"}
        alt="Logo"
        width={100}
        height={100}
        className="size-8"
      />
      {iconOnly ? null : (
        <p className="flex items-center text-sm font-bold">
          <span className="text-foreground">Lego</span>
          <span className="text-primary">node</span>
        </p>
      )}
    </Link>
  );
};

export default Logo;
