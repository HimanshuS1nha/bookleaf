import { cn } from "@/lib/utils";

type Spine = {
  title: string;
  className: string;
  height: string;
  width: string;
};

const spines: Spine[] = [
  {
    title: "The Salt Orchard",
    className: "bg-primary text-primary-foreground",
    height: "h-64",
    width: "w-12",
  },
  {
    title: "Small Hours",
    className: "bg-foreground text-background",
    height: "h-56",
    width: "w-10",
  },
  {
    title: "Letters to Kasauli",
    className: "bg-chart-2 text-white",
    height: "h-72",
    width: "w-14",
  },
  {
    title: "Monsoon Arithmetic",
    className: "bg-secondary text-secondary-foreground",
    height: "h-60",
    width: "w-11",
  },
  {
    title: "A Field Guide to Leaving",
    className: "bg-chart-1 text-white",
    height: "h-[17rem]",
    width: "w-12",
  },
];

// Index of the spine the ticket slip is tucked into
const TICKETED_SPINE = 2;

export const Bookshelf = () => {
  return (
    <figure
      role="img"
      aria-label="A shelf of five books. A support ticket slip about a missing royalty statement is tucked into one of them."
      className="relative mx-auto w-full max-w-md"
    >
      <div className="flex items-end justify-center gap-1.5 px-6 pt-36">
        {spines.map((spine, index) => (
          <div
            key={spine.title}
            className={cn(
              "relative flex shrink-0 justify-center rounded-t-sm rounded-b-[2px] py-4 shadow-sm",
              "transition-transform duration-300 ease-out motion-safe:hover:-translate-y-2",
              spine.className,
              spine.height,
              spine.width,
            )}
          >
            <span className="font-serif text-sm font-medium tracking-wide [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
              {spine.title}
            </span>
            <span className="absolute inset-x-1.5 top-2 h-px bg-current opacity-30" />
            <span className="absolute inset-x-1.5 bottom-2 h-px bg-current opacity-30" />

            {index === TICKETED_SPINE && <TicketSlip />}
          </div>
        ))}
      </div>
      <div className="h-3 rounded-sm bg-foreground/85" />
      <div className="mx-4 h-2 rounded-b-sm bg-foreground/20" />
    </figure>
  );
};

const TicketSlip = () => {
  return (
    <div
      className={cn(
        "absolute bottom-[85%] left-1/2 z-10 w-56 -translate-x-[30%] rotate-[4deg] origin-bottom",
        "rounded-sm border bg-popover p-3 text-left text-popover-foreground shadow-md",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-16 motion-safe:duration-700 motion-safe:delay-300 motion-safe:fill-mode-both",
      )}
    >
      <div className="flex items-center justify-between font-mono text-[0.65rem] tracking-wide text-muted-foreground uppercase">
        <span>Ticket #0142</span>
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-primary">
          In progress
        </span>
      </div>
      <p className="mt-2 font-serif text-[0.95rem] leading-snug">
        Royalty statement missing for March
      </p>
      <p className="mt-2 border-t border-dashed pt-2 font-mono text-[0.65rem] text-muted-foreground">
        Letters to Kasauli · Paperback
      </p>
    </div>
  );
};
