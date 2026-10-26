// src/content/about.ts
export interface ContentBlock<T> {
  approved: boolean;
  value: T;
}

export const ABOUT = {
  mission: {
    approved: false,
    value:
      "To help people and businesses buy, rent, manage and invest in property with clear information, fair dealing and dependable support from first enquiry to handover.",
  } satisfies ContentBlock<string>,
  vision: {
    approved: false,
    value: "To be the real estate partner Abuja trusts first, and to carry that standard to other Nigerian cities.",
  } satisfies ContentBlock<string>,
  values: {
    approved: false,
    value: [
      { name: "Integrity", text: "We say what we know, mark what we have not verified, and put agreed terms in writing." },
      { name: "Clarity", text: "Prices, charges and next steps are explained before anyone is asked to pay." },
      { name: "Diligence", text: "We follow up, check documents and show up on time for inspections." },
      { name: "Respect", text: "Every buyer, tenant, landlord and developer gets the same courtesy and attention." },
    ],
  } satisfies ContentBlock<{ name: string; text: string }[]>,
  leadership: {
    approved: true,
    value: [] as { name: string; role: string; bio: string; photo_url?: string }[],
  },
  milestones: {
    approved: true,
    value: [] as { year: string; text: string }[],
  },
};
