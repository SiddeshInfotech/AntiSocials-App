// Single source of truth for the 3-tier relationship model used across the Connect section.
// Mirrors the backend enum in Backend/controllers/profileController.js (RELATIONSHIP_TIERS).

export type RelationshipTier = "CLOSE" | "FAMILY_REGULAR" | "GROWING_FOLLOWER";

export const DEFAULT_RELATIONSHIP_TIER: RelationshipTier = "GROWING_FOLLOWER";

export interface RelationshipTierInfo {
  value: RelationshipTier;
  label: string;
  shortLabel: string;
  description: string;
}

export const RELATIONSHIP_TIERS: RelationshipTierInfo[] = [
  {
    value: "CLOSE",
    label: "Close",
    shortLabel: "Close",
    description: "Your closest, most trusted people",
  },
  {
    value: "FAMILY_REGULAR",
    label: "Family / Regular",
    shortLabel: "Family",
    description: "Family and regular, meaningful connections",
  },
  {
    value: "GROWING_FOLLOWER",
    label: "Growing / Follower",
    shortLabel: "Growing",
    description: "Newer connections you're getting to know",
  },
];

export const getRelationshipTierInfo = (tier?: string | null): RelationshipTierInfo => {
  return (
    RELATIONSHIP_TIERS.find((t) => t.value === tier) ||
    RELATIONSHIP_TIERS.find((t) => t.value === DEFAULT_RELATIONSHIP_TIER)!
  );
};
