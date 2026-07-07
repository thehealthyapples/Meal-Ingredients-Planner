import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanionAvatar } from "./CompanionAvatar";

export function CompanionPresenceBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("companion:open"))}
          className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Ask Apple"
          data-testid="button-companion-presence"
        >
          <CompanionAvatar size="sm" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Ask Apple</TooltipContent>
    </Tooltip>
  );
}
