import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Search,
  Heart,
  Leaf,
  Star,
  MapPin,
  Globe,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";
import { getActivePartners, getFeaturedPartners } from "@/data/partners";
import { PARTNER_CATEGORIES } from "@/types/partner";
import type { Partner, ServiceType } from "@/types/partner";

const BADGE_STYLES: Record<string, string> = {
  "THA Recommended":
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  "Local Partner":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  "Online Service":
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  "Affiliate Link":
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  Featured:
    "bg-primary/10 text-primary border-primary/20",
  New: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
};

function PartnerAvatar({ partner }: { partner: Partner }) {
  if (partner.imageUrl) {
    return (
      <img
        src={partner.imageUrl}
        alt={partner.name}
        className="w-14 h-14 rounded-xl object-cover"
      />
    );
  }
  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
      style={{ backgroundColor: partner.accentColor }}
    >
      {partner.initials}
    </div>
  );
}

function PartnerBadgeList({ badges }: { badges: Partner["badges"] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${BADGE_STYLES[badge] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div
      className="group bg-white/82 dark:bg-card/85 shadow-sm border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20"
      data-testid={`partner-card-${partner.id}`}
    >
      <div className="flex items-start gap-3">
        <PartnerAvatar partner={partner} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base leading-tight">
            {partner.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {partner.tagline}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground/70">
            {partner.location ? (
              <>
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span>{partner.location}</span>
                <span className="mx-1">·</span>
              </>
            ) : null}
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="capitalize">{partner.serviceType === "both" ? "Online & Local" : partner.serviceType}</span>
          </div>
        </div>
      </div>

      <PartnerBadgeList badges={partner.badges} />

      <p className="text-sm text-foreground/70 leading-relaxed">
        {partner.shortDescription}
      </p>

      {partner.whyTHARecommends && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
          <p className="text-[11px] text-primary/80 leading-relaxed">
            <span className="font-semibold">Why THA likes them: </span>
            <span className="italic">{partner.whyTHARecommends}</span>
          </p>
        </div>
      )}

      <div className="mt-auto pt-1">
        <a
          href={partner.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid={`link-visit-${partner.id}`}
        >
          Visit Partner
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function FeaturedCard({ partner }: { partner: Partner }) {
  return (
    <div
      className="group relative bg-white/82 dark:bg-card/85 shadow-sm border border-border rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 overflow-hidden"
      data-testid={`featured-card-${partner.id}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: partner.accentColor }}
      />
      <div className="flex items-center gap-3 mt-1">
        <PartnerAvatar partner={partner} />
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground text-base">
              {partner.name}
            </h3>
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{partner.tagline}</p>
        </div>
      </div>

      <PartnerBadgeList badges={partner.badges} />

      <p className="text-sm text-foreground/70 leading-relaxed">
        {partner.shortDescription}
      </p>

      {partner.whyTHARecommends && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
          <p className="text-[11px] text-primary/80 leading-relaxed italic">
            "{partner.whyTHARecommends}"
          </p>
        </div>
      )}

      <a
        href={partner.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        data-testid={`link-featured-${partner.id}`}
      >
        Visit Partner
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ApplicationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    website: "",
    category: "",
    description: "",
    contactEmail: "",
    socialLinks: "",
    reciprocalLink: "yes",
    whyFit: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Partner with THA</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tell us about your wellness service or brand. We review all applications personally and aim to respond within 5–7 working days.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Application received</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for reaching out. We'll review your application and be in touch soon.
            </p>
            <Button variant="outline" size="sm" onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Business / Service Name *</label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Calm Orchard Yoga"
                required
                data-testid="input-partner-name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Website *</label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                type="url"
                required
                data-testid="input-partner-website"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="select-partner-category"
              >
                <option value="">Select a category…</option>
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Short Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell us what you offer and who it's for (2–4 sentences)"
                required
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                data-testid="textarea-partner-description"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Contact Email *</label>
              <Input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="hello@yourwebsite.com"
                type="email"
                required
                data-testid="input-partner-email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Social Links</label>
              <Input
                value={form.socialLinks}
                onChange={(e) => setForm({ ...form, socialLinks: e.target.value })}
                placeholder="Instagram, LinkedIn, or other social profiles"
                data-testid="input-partner-social"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Would you offer a reciprocal link to THA? *</label>
              <div className="flex gap-4 mt-1">
                {["yes", "no", "happy-to-discuss"].map((val) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="reciprocalLink"
                      value={val}
                      checked={form.reciprocalLink === val}
                      onChange={() => setForm({ ...form, reciprocalLink: val })}
                      className="accent-primary"
                    />
                    {val === "yes" ? "Yes" : val === "no" ? "No" : "Happy to discuss"}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Why is this a good fit for THA?</label>
              <textarea
                value={form.whyFit}
                onChange={(e) => setForm({ ...form, whyFit: e.target.value })}
                placeholder="Help us understand how your service supports healthy living and aligns with our community"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                data-testid="textarea-partner-fit"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" data-testid="button-submit-application">
                Send Application
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | ServiceType>("all");
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Healthy Living Partners | The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  const allPartners = getActivePartners();
  const featuredPartners = getFeaturedPartners();

  const filteredPartners = useMemo(() => {
    return allPartners.filter((p) => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesService =
        serviceFilter === "all" || p.serviceType === serviceFilter || p.serviceType === "both";
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesService && matchesSearch;
    });
  }, [allPartners, selectedCategory, serviceFilter, searchQuery]);

  const SERVICE_TYPES: Array<{ value: "all" | ServiceType; label: string }> = [
    { value: "all", label: "All" },
    { value: "online", label: "Online" },
    { value: "local", label: "Local" },
    { value: "both", label: "Both" },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-primary/8 via-background to-primary/4 border border-border px-6 sm:px-12 py-7 sm:py-10 text-center space-y-3" data-testid="partners-hero">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full border border-primary/20">
          <Leaf className="h-3.5 w-3.5" />
          Curated Wellness Partners
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug" data-testid="partners-hero-heading">
          Support your health<br className="hidden sm:block" /> beyond the basket
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Discover trusted wellness partners and resources that complement your journey with THA — from yoga teachers and nutritionists to mindfulness coaches and healthy cooking guides.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button
            className="gap-2"
            onClick={() => {
              document.getElementById("partners-grid")?.scrollIntoView({ behavior: "smooth" });
            }}
            data-testid="button-explore-partners"
          >
            <Sparkles className="h-4 w-4" />
            Explore Partners
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setApplyModalOpen(true)}
            data-testid="button-become-partner"
          >
            <Heart className="h-4 w-4" />
            Become a Partner
          </Button>
        </div>
      </section>

      {/* Featured Partners */}
      {featuredPartners.length > 0 && (
        <section className="space-y-5" data-testid="featured-partners-section">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h2 className="text-xl font-semibold text-foreground">Featured Partners</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPartners.map((p) => (
              <FeaturedCard key={p.id} partner={p} />
            ))}
          </div>
        </section>
      )}

      {/* Category Filter + Search */}
      <section className="space-y-4" id="partners-grid">
        <div className="flex flex-col gap-4">
          {/* Category pills */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Filter by category</p>
            <div
              className="flex flex-wrap gap-2"
              data-testid="category-filter"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === "All"
                    ? "bg-primary/10 text-primary border-primary/30 font-medium"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}
                data-testid="category-pill-all"
              >
                All
              </button>
              {PARTNER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary/10 text-primary border-primary/30 font-medium"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  }`}
                  data-testid={`category-pill-${cat.toLowerCase().replace(/[\s&/]+/g, "-")}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search + service type */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners, services, or keywords"
                className="pl-9"
                data-testid="input-partner-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div
              className="flex rounded-lg border border-border overflow-hidden bg-background"
              data-testid="service-type-filter"
            >
              {SERVICE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setServiceFilter(value)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    serviceFilter === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`service-type-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Partner grid */}
        {filteredPartners.length === 0 ? (
          <div className="text-center py-16 space-y-2" data-testid="partners-empty-state">
            <p className="text-muted-foreground font-medium">No partners match your filters</p>
            <p className="text-sm text-muted-foreground/70">Try a different category or clear the search</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setServiceFilter("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground" data-testid="partners-count">
                {filteredPartners.length} partner{filteredPartners.length !== 1 ? "s" : ""}
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
              </p>
              {(selectedCategory !== "All" || searchQuery || serviceFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setServiceFilter("all");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-testid="partners-grid"
            >
              {filteredPartners.map((p) => (
                <PartnerCard key={p.id} partner={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Trust section */}
      <section
        className="rounded-2xl bg-muted/30 border border-border px-6 sm:px-10 py-8 space-y-4 max-w-3xl"
        data-testid="trust-section"
      >
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Why we share these links</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Healthy living goes far beyond what you put in your basket. We believe that movement, rest, mindfulness, and community are just as important as the food we eat — and so we curate a small, thoughtful selection of partners who share our values.
          </p>
          <p>
            Every partner featured here has been reviewed by the THA team. We look for aligned values, genuine quality, and services that we'd be happy to recommend to a close friend.
          </p>
          <p className="text-muted-foreground/70 text-xs border-t border-border pt-3 mt-3">
            <strong className="text-muted-foreground">A note on transparency:</strong> Some links on this page may be affiliate links — meaning THA may receive a small commission if you make a purchase, at no extra cost to you. Some partners may also receive featured placement. We only feature services we genuinely believe in, and we encourage you to do your own research before engaging any professional health service.
          </p>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section
        className="rounded-3xl bg-gradient-to-br from-primary/8 via-background to-primary/4 border border-border px-6 sm:px-12 py-10 sm:py-14 text-center space-y-4"
        data-testid="become-partner-section"
      >
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Partner with THA
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Are you a wellness professional, healthy living brand, or service that supports whole-person health? We'd love to hear from you. We're always open to partnerships that genuinely benefit our community.
        </p>
        <Button
          size="lg"
          className="gap-2 mt-2"
          onClick={() => setApplyModalOpen(true)}
          data-testid="button-apply-to-join"
        >
          Apply to Join
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground/60 mt-2">
          We personally review every application and aim to respond within 5–7 working days.
        </p>
      </section>

      <ApplicationModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
      />
    </div>
  );
}
