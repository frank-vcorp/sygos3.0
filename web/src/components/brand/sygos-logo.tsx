import Image from "next/image";

type SygosLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
};

const LOGO_WIDTH = 220;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 793) / 1983);

export function SygosLogo({
  variant = "dark",
  className = "",
  showTagline = false,
}: SygosLogoProps) {
  const image = (
    <Image
      src="/brand/sygos-logo.png"
      alt="Sygos 3.0 — Monitoreo inteligente para Systron"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority
      className="h-auto w-[min(100%,180px)] sm:w-[220px]"
    />
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {variant === "light" ? (
        <div className="inline-flex w-fit rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
          {image}
        </div>
      ) : (
        image
      )}
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
