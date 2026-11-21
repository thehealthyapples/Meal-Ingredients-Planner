import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadError } from "@/components/ui/load-error";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, Save, Loader2, AlertCircle, CheckCircle,
} from "lucide-react";

type RelationshipLabel = "owner" | "spouse" | "child" | "parent" | "sibling" | "other" | null;

interface HouseholdMember {
  id: number;
  userId: number;
  displayName: string;
  role: string;
  relationshipLabel: RelationshipLabel;
  dietTypes: string[];
  hardRestrictions: string[];
}

interface Household {
  id: number;
  name: string;
  members: HouseholdMember[];
}

const RELATIONSHIP_LABELS: Array<{ value: RelationshipLabel; label: string }> = [
  { value: null, label: "Not specified" },
  { value: "owner", label: "Me (Account owner)" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other family member" },
];

export default function HouseholdMembersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [changes, setChanges] = useState<Record<number, RelationshipLabel>>({});

  const { data: household, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/household"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/household");
      return response.json() as Promise<Household>;
    },
  });

  const updateRelationshipMutation = useMutation({
    mutationFn: async ({ memberId, relationshipLabel }: { memberId: number; relationshipLabel: RelationshipLabel }) => {
      return apiRequest("PATCH", `/api/household/member/${memberId}/relationship`, { relationshipLabel });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/household"] });
      setChanges({});
      toast({
        title: "Success",
        description: "Relationship updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relationship",
        variant: "destructive",
      });
    },
  });

  const handleRelationshipChange = (memberId: number, value: RelationshipLabel) => {
    setChanges(prev => ({ ...prev, [memberId]: value }));
  };

  const handleSaveChanges = async () => {
    for (const [memberId, relationshipLabel] of Object.entries(changes)) {
      await updateRelationshipMutation.mutateAsync({
        memberId: parseInt(memberId, 10),
        relationshipLabel: relationshipLabel as RelationshipLabel,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={pageContainerClass(true)}>
        <WorkspaceHeader realm="home" title="Family Members" wide />
        <div className="space-y-4 p-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div className={pageContainerClass(true)}>
        <WorkspaceHeader realm="home" title="Family Members" wide />
        <LoadError what="family members" onRetry={() => refetch()} />
      </div>
    );
  }

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className={pageContainerClass(true)}>
      <WorkspaceHeader realm="home" title="Family Members" wide />

      <div className="p-4 space-y-4 max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Help Companion understand your family</p>
            <p className="text-blue-800 mt-1">
              Tag family members so when you ask "what can't my wife eat?" Companion knows exactly who you mean.
            </p>
          </div>
        </div>

        {household.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family members"
            description="You haven't added any family members to your household yet"
            variant="empty"
          />
        ) : (
          <div className="space-y-3">
            {household.members.map(member => {
              const selectedRelationship = changes[member.id] ?? member.relationshipLabel;
              const isChanged = changes[member.id] !== undefined;

              return (
                <Card key={member.id} className={`p-4 ${isChanged ? "border-blue-300 bg-blue-50" : ""}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {member.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.displayName}</p>
                      {member.dietTypes.length > 0 || member.hardRestrictions.length > 0 ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {member.dietTypes.map(dt => (
                            <Badge key={dt} variant="secondary" className="text-xs">
                              {dt}
                            </Badge>
                          ))}
                          {member.hardRestrictions.map(hr => (
                            <Badge key={hr} variant="destructive" className="text-xs">
                              {hr}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      Relationship to you
                    </label>
                    <Select
                      value={selectedRelationship ?? ""}
                      onValueChange={(value: string) => {
                        const val = value === "" ? null : (value as RelationshipLabel);
                        handleRelationshipChange(member.id, val);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder="Not specified"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_LABELS.map(opt => (
                          <SelectItem
                            key={opt.value ?? "_null_"}
                            value={opt.value ?? "_null_"}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isChanged && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      Unsaved change
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {household.members.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || updateRelationshipMutation.isPending}
                variant="default"
                className="flex items-center gap-2"
              >
                {updateRelationshipMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={() => setChanges({})}
                >
                  Discard
                </Button>
              )}
            </div>
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 mt-6">
          <p className="font-medium mb-2">Why does this matter?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Companion can answer "what can't my child eat?" more accurately</li>
            <li>Family members become individually identifiable in natural conversation</li>
            <li>Diet restrictions stay correctly attributed when asking about specific people</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
