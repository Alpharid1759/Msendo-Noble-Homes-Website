// src/components/site/nav-items.ts
export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/properties", label: "Properties" },
  { href: "/properties/for-sale", label: "For Sale" },
  { href: "/properties/for-rent", label: "For Rent" },
  { href: "/gallery/videos/for-sale", label: "Video Gallery", match: "/gallery" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
] as const;

export const FOOTER_LINKS = {
  explore: [
    { href: "/properties/for-sale", label: "Properties for sale" },
    { href: "/properties/for-rent", label: "Properties for rent" },
    { href: "/search", label: "Advanced search" },
    { href: "/gallery/photos/for-sale", label: "Photo gallery: sales" },
    { href: "/gallery/photos/for-rent", label: "Photo gallery: rentals" },
    { href: "/gallery/videos/for-sale", label: "Video gallery: sales" },
    { href: "/gallery/videos/for-rent", label: "Video gallery: rentals" },
  ],
  company: [
    { href: "/about", label: "About us" },
    { href: "/services", label: "Services" },
    { href: "/blog", label: "Insights" },
    { href: "/faq", label: "FAQs" },
    { href: "/list-your-property", label: "List your property" },
    { href: "/schedule-inspection", label: "Book an inspection" },
    { href: "/contact", label: "Contact us" },
  ],
  legal: [
    { href: "/legal/privacy", label: "Privacy policy" },
    { href: "/legal/terms", label: "Terms of use" },
    { href: "/legal/cookies", label: "Cookie policy" },
    { href: "/legal/listing-disclaimer", label: "Listing disclaimer" },
    { href: "/legal/accessibility", label: "Accessibility" },
  ],
};
