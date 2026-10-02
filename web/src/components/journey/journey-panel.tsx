import Link from "next/link";
import type { JourneyHint } from "@/server/journey/types";

export function JourneyPanel(props: {
  title?: string;
  hint: JourneyHint | null;
  children?: React.ReactNode;
}) {
  if (!props.hint && !props.children) return null;
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm">
      <h2 className="font-medium text-amber-950">
        {props.title ?? "Siguiente en el recorrido"}
      </h2>
      {props.hint && (
        <p className="mt-2 text-amber-900">
          {props.hint.message}
          {props.hint.href && (
            <>
              {" "}
              <Link href={props.hint.href} className="font-medium text-sygos-teal underline">
                Ir →
              </Link>
            </>
          )}
        </p>
      )}
      {props.children && <div className="mt-3">{props.children}</div>}
    </section>
  );
}
