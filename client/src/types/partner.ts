export type ServiceType = "online" | "local" | "both";
export type AffiliateType = "affiliate" | "reciprocal" | "sponsored" | "standard";
export type PartnerBadge =
  | "THA Recommended"
  | "Local Partner"
  | "Online Service"
  | "Affiliate Link"
  | "Featured"
  | "New";

export interface Partner {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  shortDescription: string;
  fullDescription?: string;
  websiteUrl: string;
  imageUrl?: string;
  initials: string;
  accentColor: string;
  location?: string;
  serviceType: ServiceType;
  badges: PartnerBadge[];
  featured: boolean;
  affiliateType: AffiliateType;
  whyTHARecommends: string;
  isActive: boolean;
  displayOrder: number;
}

export const PARTNER_CATEGORIES = [
  "Yoga & Movement",
  "Meditation & Mindfulness",
  "Nutritionists & Diet Support",
  "Healthy Cooking & Food Education",
  "Fitness & Recovery",
  "Women's Health",
  "Family Wellness",
  "Sleep & Stress Support",
  "Natural Living",
  "Local Wellness Services",
] as const;

export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];
