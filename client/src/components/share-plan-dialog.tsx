import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";
import { Copy, Check, Share2, Globe, Lock, AlertCircle, Loader2, Mail, MessageCircle } from "lucide-react";

interface MyTemplate {
  id: string;
  name: string;
  visibility?: string;
  shareToken?: string | null;
  itemCount?: number;
  season?: string | null;
}

interface LibraryResponse {
  myTemplates: MyTemplate[];
}

interface SharePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePlanDialog({ open, onOpenChange }: SharePlanDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: library, isLoading } = useQuery<LibraryResponse>({
    queryKey: ["/api/plan-templates/library"],
    enabled: open,
  });

  const myTemplates = library?.myTemplates ?? [];
  const selected = myTemplates.find(t => t.id === selectedId) ?? myTemplates[0] ?? null;
  const activeTemplate = selected;

  const hasPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "friends_family";
  const sharedCount = myTemplates.filter(t => t.visibility === "shared").length;
  const isFreeLimitReached = !hasPremium && sharedCount >= 1 && activeTemplate?.visibility !== "shared";

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/plan-templates/mine", { name: "My 6 Week Plan" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      toast({ title: "Plan saved", description: "Your planner has been saved as a template." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save planner.", variant: "destructive" }),
  });

  const shareMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/plan-templates/mine/${id}/share`),
    onSuccess: (data: { shareToken: string; url: string }) => {
      setShareUrl(data.url);
      queryClient.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to generate share link.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const unshareMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/plan-templates/mine/${id}/unshare`),
    onSuccess: () => {
      setShareUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      toast({ title: "Sharing stopped", description: "Your plan is now private." });
    },
    onError: () => toast({ title: "Error", description: "Failed to stop sharing.", variant: "destructive" }),
  });

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentUrl = shareUrl || (activeTemplate?.shareToken ? `${window.location.origin}/shared/${activeTemplate.shareToken}` : null);
  const isShared = activeTemplate?.visibility === "shared";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share-plan">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share 6 Week Plan
          </DialogTitle>
          <DialogDescription>
            Generate a link so anyone can preview and import your meal plan.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : myTemplates.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                You haven't saved your planner yet. Save it as a template first, then you can share it.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-plan-first"
            >
              {saveMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save My Planner Now"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myTemplates.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select a plan to share</p>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {myTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedId(t.id); setShareUrl(null); }}
                      data-testid={`button-select-template-${t.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm text-left transition-colors ${
                        (selectedId ?? myTemplates[0]?.id) === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium truncate">{t.name}</span>
                      {t.visibility === "shared" ? (
                        <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                          <Globe className="h-2.5 w-2.5 mr-1" />Shared
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                          <Lock className="h-2.5 w-2.5 mr-1" />Private
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTemplate && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{activeTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeTemplate.itemCount ?? 0} meals · {isShared ? "Currently shared" : "Private"}
                    </p>
                  </div>
                  {isShared ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                      <Globe className="h-3 w-3 mr-1" />Live
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Lock className="h-3 w-3 mr-1" />Private
                    </Badge>
                  )}
                </div>

                {isFreeLimitReached ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Free plan limit reached</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Free accounts can share 1 plan at a time. Stop sharing another plan first, or upgrade to Premium for unlimited sharing.
                    </p>
                  </div>
                ) : isShared && currentUrl ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Share link</p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={currentUrl}
                          className="text-xs font-mono"
                          data-testid="input-share-url"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCopy}
                          data-testid="button-copy-link"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Check out my 6-week meal plan: ${currentUrl}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="link-share-whatsapp"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                          WhatsApp
                        </Button>
                      </a>
                      <a
                        href={`mailto:?subject=My 6-Week Meal Plan&body=${encodeURIComponent(`I wanted to share my meal plan with you: ${currentUrl}`)}`}
                        data-testid="link-share-email"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Button>
                      </a>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => unshareMutation.mutate(activeTemplate.id)}
                      disabled={unshareMutation.isPending}
                      data-testid="button-stop-sharing"
                    >
                      {unshareMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                      Stop Sharing
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => shareMutation.mutate(activeTemplate.id)}
                    disabled={shareMutation.isPending}
                    data-testid="button-generate-link"
                  >
                    {shareMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Globe className="h-4 w-4 mr-2" />Generate Share Link</>
                    )}
                  </Button>
                )}
              </>
            )}

            {!hasPremium && (
              <p className="text-xs text-muted-foreground text-center">
                Free plan: 1 shared link · <a href="/profile" className="underline hover:text-primary">Upgrade to Premium</a> for unlimited
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
