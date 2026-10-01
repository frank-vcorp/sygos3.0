import Image from "next/image";

type SygosLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
};

export function SygosLogo({
  variant = "dark",
  className = "",
  showTagline = false,
}: SygosLogoProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Image
        src="/brand/sygos-logo.png"
        alt="Sygos"
        width={220}
        height={72}
        priority
        className={
          variant === "light"
            ? "brightness-0 invert opacity-95 h-auto w-[180px] sm:w-[220px]"
            : "h-auto w-[180px] sm:w-[220px]"
        }
      />
      {showTagline && (
        <p
          className={
            variant === "light"
              ? "text-sm text-sygos-teal-light"
              : "text-sm text-sygos-teal"
          }
        >
          Monitoreo inteligente para Systron
        </p>
      )}
    </div>
  );
}
