export function companionBubbleClass(isUser: boolean): string {
  return isUser
    ? "bg-primary/10 text-foreground rounded-2xl rounded-tr-sm"
    : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border/30";
}
