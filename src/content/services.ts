// src/content/services.ts
export interface Service {
  slug: string;
  name: string;
  summary: string;
  description: string[];
  benefits: string[];
  process: string[];
  faqs: { q: string; a: string }[];
  cta: { label: string; href: string };
  icon: "home" | "key" | "map" | "building" | "wrench" | "chart" | "crane" | "bed" | "warehouse" | "clipboard";
}

export const SERVICES: Service[] = [
  {
    slug: "property-sales",
    name: "Property sales and acquisition",
    icon: "home",
    summary: "Find, inspect and buy homes, land and commercial property in Abuja with one team handling the process.",
    description: [
      "We help buyers find property that matches their budget, location and purpose, whether that is a family home, an investment apartment or a plot to build on.",
      "We arrange inspections, gather the documents the seller holds, and coordinate with your lawyer and surveyor so you can make the decision with the facts in front of you.",
    ],
    benefits: [
      "A shortlist built around your brief rather than whatever is available that week",
      "Asking price, charges and title documents set out before you inspect",
      "Coordination with your own lawyer for searches and the deed of assignment",
    ],
    process: [
      "Tell us what you are looking for and your budget",
      "Review a shortlist and visit the properties you like",
      "We collect the seller's documents for your lawyer to verify",
      "Agree terms and complete the transfer through your lawyer",
    ],
    faqs: [
      {
        q: "Do you verify title documents?",
        a: "We collect and review the documents a seller provides and mark a listing as verified only after that review. Your own lawyer should still carry out an independent search at the land registry before you pay.",
      },
      {
        q: "Can I buy from outside Nigeria?",
        a: "Yes. We can run video inspections and work with a lawyer you appoint, so you do not need to travel until you choose to.",
      },
    ],
    cta: { label: "Browse properties for sale", href: "/properties/for-sale" },
  },
  {
    slug: "rentals",
    name: "Residential and commercial rentals",
    icon: "key",
    summary: "Apartments, houses, offices and shops to let, with rent and every additional charge shown separately.",
    description: [
      "We match tenants with homes and business premises across Abuja and help both sides agree clear terms.",
      "Every rental listing shows the rent on its own line. Caution deposits, agency fees, legal fees and service charges are listed separately so there are no surprises at signing.",
    ],
    benefits: [
      "Transparent costs before you inspect",
      "Inspection times confirmed by phone before you travel",
      "Help reviewing the tenancy agreement with the landlord",
    ],
    process: [
      "Search rentals or send us your requirements",
      "Book an inspection at a confirmed time",
      "Agree terms and review the tenancy agreement",
      "Pay through the agreed channel and collect your keys",
    ],
    faqs: [
      {
        q: "Is the rent the only cost?",
        a: "Not always. Landlords may require a caution deposit, and agency, legal or service charges may apply. Each listing shows these separately, and we confirm the final figures in writing.",
      },
      {
        q: "Do you offer monthly rent?",
        a: "Some landlords accept monthly or quarterly payments. Use the rent period filter or ask us which properties allow it.",
      },
    ],
    cta: { label: "Browse properties for rent", href: "/properties/for-rent" },
  },
  {
    slug: "land-and-documentation",
    name: "Land acquisition and documentation coordination",
    icon: "map",
    summary: "Plots for residential, commercial and mixed-use development, with documents gathered for your legal checks.",
    description: [
      "Land purchases carry the most risk in Nigerian real estate. We focus on helping you understand what a seller holds before you commit.",
      "We gather survey plans, allocation papers and title documents, and coordinate with licensed surveyors and your lawyer for checks and perfection of title.",
    ],
    benefits: [
      "Documents assembled before any payment is requested",
      "Coordination with licensed surveyors for site verification",
      "Guidance on the steps to perfect your title after purchase",
    ],
    process: [
      "Choose a plot and inspect the site",
      "We gather the seller's documents and survey plan",
      "Your lawyer and surveyor carry out independent checks",
      "Complete the purchase and begin perfection of title",
    ],
    faqs: [
      {
        q: "Do you provide legal advice?",
        a: "No. We coordinate documents and the process. Legal advice and searches should come from a lawyer you appoint.",
      },
    ],
    cta: { label: "View land for sale", href: "/properties/for-sale?category=land-plots" },
  },
  {
    slug: "property-management",
    name: "Property management",
    icon: "clipboard",
    summary: "Tenant sourcing, rent collection, inspections and maintenance coordination for landlords.",
    description: [
      "We look after rented property on behalf of owners who want reliable tenants and a well-kept building without handling the day-to-day themselves.",
      "Services can be scoped to your needs, from tenant placement only to full management with periodic inspection reports.",
    ],
    benefits: [
      "Tenant enquiries and inspections handled for you",
      "Rent reminders and collection follow-up",
      "Repairs coordinated with vetted contractors",
    ],
    process: [
      "Tell us about the property and what you need",
      "Agree a management scope and fee in writing",
      "We market the property and place a tenant",
      "Ongoing collection, inspections and reporting",
    ],
    faqs: [
      {
        q: "How are management fees charged?",
        a: "Fees depend on the property and scope of work. We agree them in writing before we start.",
      },
    ],
    cta: { label: "Request property management", href: "/contact?category=property_management" },
  },
  {
    slug: "facility-management",
    name: "Facility management",
    icon: "wrench",
    summary: "Upkeep of estates, offices and commercial buildings: cleaning, security, power and maintenance coordination.",
    description: [
      "For estates and commercial buildings we coordinate the services that keep a property running, working with specialist contractors.",
    ],
    benefits: ["One point of contact for building services", "Planned maintenance schedules", "Regular condition reports"],
    process: ["Site visit and needs assessment", "Agree a service plan", "Mobilise contractors", "Ongoing supervision and reporting"],
    faqs: [
      {
        q: "Do you handle single apartments?",
        a: "Facility management is usually for whole buildings or estates. For individual units, see property management.",
      },
    ],
    cta: { label: "Discuss facility management", href: "/contact?category=property_management" },
  },
  {
    slug: "investment-advisory",
    name: "Real estate investment consultancy",
    icon: "chart",
    summary: "Help comparing locations, property types and rental demand before you invest.",
    description: [
      "We share what we see in the Abuja market: where tenants are looking, what different property types let for, and what to check before committing capital.",
      "This is market guidance, not regulated financial advice. For tax, legal or financing decisions, speak to a qualified professional.",
    ],
    benefits: ["Location and property-type comparisons", "Rental demand insight from our enquiries", "Introductions to developers and partners"],
    process: ["Share your goals and budget", "Review options and comparables", "Inspect shortlisted properties", "Proceed with your professional advisers"],
    faqs: [
      {
        q: "Do you guarantee returns?",
        a: "No. Property values and rents can fall as well as rise. We share market information so you can make your own decision.",
      },
    ],
    cta: { label: "Speak to our team", href: "/contact?category=investment" },
  },
  {
    slug: "development-and-project-marketing",
    name: "Property development and project marketing",
    icon: "crane",
    summary: "Marketing and sales support for estates and off-plan developments, and development partnerships.",
    description: [
      "We work with developers to present projects clearly, with accurate specifications, payment plans and progress updates.",
      "Landowners and investors interested in joint ventures can discuss partnership opportunities with us.",
    ],
    benefits: ["Listings with photos, video and plans", "Enquiry handling and inspection scheduling", "Progress updates published for buyers"],
    process: ["Project briefing", "Agree marketing scope", "Launch listings and campaigns", "Manage enquiries through to sale"],
    faqs: [
      {
        q: "Do you market off-plan projects?",
        a: "Yes, where the developer provides the approvals and documents buyers need to see.",
      },
    ],
    cta: { label: "Discuss your project", href: "/contact?category=investment" },
  },
  {
    slug: "short-let",
    name: "Short-let and serviced accommodation",
    icon: "bed",
    summary: "Furnished apartments for nightly, weekly and monthly stays.",
    description: [
      "Short-let listings show the nightly or weekly rate, any caution deposit, and what is included, such as power, internet and cleaning.",
      "Owners can also list furnished apartments with us for short-let management.",
    ],
    benefits: ["Clear nightly or weekly pricing", "Deposits and inclusions stated upfront", "WhatsApp support for bookings"],
    process: ["Choose dates and an apartment", "Confirm availability with us", "Pay the agreed amount", "Check in"],
    faqs: [
      {
        q: "Can I book online?",
        a: "Send an enquiry or WhatsApp message with your dates. We confirm availability before any payment.",
      },
    ],
    cta: { label: "View short-lets", href: "/properties/for-rent?rental=short" },
  },
  {
    slug: "commercial-and-industrial",
    name: "Commercial and industrial property",
    icon: "warehouse",
    summary: "Offices, shops, plazas and warehouses to buy or lease.",
    description: [
      "We help businesses find premises that suit their operations, staff and budget, from small offices to warehouses in industrial areas.",
    ],
    benefits: ["Floor area, power and parking details on every listing", "Lease terms negotiated with landlords", "Support for fit-out planning"],
    process: ["Brief us on your space needs", "Inspect shortlisted premises", "Negotiate lease or purchase terms", "Move in"],
    faqs: [
      {
        q: "Do you handle large warehouses?",
        a: "Yes. Tell us the floor area, access and power requirements and we will search our listings and network.",
      },
    ],
    cta: { label: "View commercial property", href: "/properties?category=commercial" },
  },
  {
    slug: "list-your-property",
    name: "Landlord and developer listing services",
    icon: "building",
    summary: "List your property for sale or rent with photography, video and enquiry handling.",
    description: [
      "Owners, landlords and developers can submit a property for listing. Our team reviews every submission and the documents behind it before anything is published.",
    ],
    benefits: ["Professional listing with photos and video", "Enquiries and inspections handled for you", "Honest guidance on asking price"],
    process: ["Submit your property", "We review details and documents", "Photography and listing preparation", "Publish and manage enquiries"],
    faqs: [
      {
        q: "Is there a fee to list?",
        a: "Terms depend on the property and service. We agree them with you in writing before publishing.",
      },
    ],
    cta: { label: "List your property", href: "/list-your-property" },
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug) ?? null;
}
