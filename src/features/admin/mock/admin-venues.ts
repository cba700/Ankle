import { getAdminMatches } from "./admin-matches";
import type { AdminVenueOption, AdminVenueRecord } from "../types";

const ADMIN_VENUES: AdminVenueRecord[] = getAdminMatches().reduce<AdminVenueRecord[]>(
  (venues, match) => {
    const existingVenue = venues.find((venue) => venue.id === match.venueId);

    if (existingVenue) {
      existingVenue.matchCount += 1;
      return venues;
    }

    venues.push({
      id: match.venueId,
      slug: match.slug.split("-").slice(0, -2).join("-"),
      name: match.venueName,
      district: match.district,
      address: match.address,
      isActive: true,
      matchCount: 1,
      venueInfo: match.venueInfo,
      defaultImageUrls: match.imageUrls,
      defaultRules: match.rules,
      defaultSafetyNotes: match.safetyNotes,
    });

    return venues;
  },
  [],
).sort((left, right) => left.name.localeCompare(right.name, "ko-KR"));

export function getAdminVenues() {
  return ADMIN_VENUES.map((venue) => ({
    ...venue,
    venueInfo: { ...venue.venueInfo },
    defaultImageUrls: venue.defaultImageUrls.slice(),
    defaultRules: venue.defaultRules.slice(),
    defaultSafetyNotes: venue.defaultSafetyNotes.slice(),
  }));
}

export function getAdminVenueById(id: string) {
  return getAdminVenues().find((venue) => venue.id === id);
}

export function getAdminVenueOptions(): AdminVenueOption[] {
  return getAdminVenues().map((venue) => ({
    id: venue.id,
    label: `${venue.name} · ${venue.district}`,
    isActive: venue.isActive,
    name: venue.name,
    district: venue.district,
    address: venue.address,
    venueInfo: venue.venueInfo,
    defaultImageUrls: venue.defaultImageUrls,
    defaultRules: venue.defaultRules,
    defaultSafetyNotes: venue.defaultSafetyNotes,
  }));
}
