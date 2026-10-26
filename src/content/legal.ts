// src/content/legal.ts
export interface LegalDoc {
  slug: string;
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export function legalDocs(ctx: { legalName: string; brand: string; email: string; dpEmail: string; address: string; retentionMonths: number }): LegalDoc[] {
  const { legalName, brand, email, dpEmail, address, retentionMonths } = ctx;
  return [
    {
      slug: "privacy",
      title: "Privacy policy",
      description: `How ${brand} collects, uses and protects personal data under the Nigeria Data Protection Act 2023.`,
      updated: "26 October 2026",
      sections: [
        {
          heading: "Who we are",
          body: [
            `${brand} is the real estate division of ${legalName} ("we", "us"). ${legalName} is the data controller for personal data collected through this website. Our office is at ${address}.`,
            `For any privacy question or request, contact us at ${dpEmail} or through the contact form, choosing "Personal data request".`,
          ],
        },
        {
          heading: "What we collect",
          body: [
            "Details you give us in forms: your name, phone number, email address, the property you are interested in, your message, preferred inspection times and, for property submissions, details of the property.",
            "Technical data: a one-way hashed form of your IP address and your browser type, used to prevent spam and abuse. We do not store your raw IP address with your enquiry.",
            "If you accept analytics cookies, anonymised usage data such as pages viewed and buttons pressed. We never send your name, phone number or email address to analytics providers.",
          ],
        },
        {
          heading: "How and why we use it",
          body: [
            "To respond to enquiries, arrange and confirm inspections, and progress a purchase, rental or listing you have asked about. The lawful basis is your consent and steps taken at your request before entering into a contract.",
            "To send our newsletter if you subscribe. The lawful basis is your consent, which you can withdraw at any time using the unsubscribe link.",
            "To keep the website secure and prevent fraud and spam. The lawful basis is our legitimate interest in operating a safe service.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Our staff who need it to help you, and the property owner, landlord or developer where you have asked us to progress a transaction with them.",
            "Service providers who host our database and website, deliver email, and, if you consent, provide analytics. They process data only on our instructions. Some of these providers store data outside Nigeria; where they do, we rely on safeguards permitted by the Nigeria Data Protection Act 2023.",
            "We do not sell your personal data.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            `Enquiry and inspection records are kept for up to ${retentionMonths} months after our last contact with you, unless a transaction requires us to keep them longer for legal or accounting reasons.`,
            "Newsletter records are kept until you unsubscribe, after which we keep only a record of your choice so that we do not contact you again.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Under the Nigeria Data Protection Act 2023 you may ask to access, correct or delete your personal data, object to or restrict its use, withdraw consent, and receive a copy of data you provided in a portable form.",
            `To make a request, email ${dpEmail}. We may need to confirm your identity. You may also complain to the Nigeria Data Protection Commission.`,
          ],
        },
        {
          heading: "Security",
          body: [
            "Data is transmitted over encrypted connections and stored in access-controlled systems. Only authorised staff can see enquiry details, and access is logged.",
          ],
        },
        {
          heading: "Changes",
          body: ["We will update this page if our practices change and show the date of the latest version at the top."],
        },
      ],
    },
    {
      slug: "terms",
      title: "Terms of use",
      description: `The terms that apply when you use the ${brand} website.`,
      updated: "26 October 2026",
      sections: [
        {
          heading: "About these terms",
          body: [`This website is operated by ${legalName}. By using it you agree to these terms. If you do not agree, please do not use the site.`],
        },
        {
          heading: "Listings and information",
          body: [
            "Property information is provided in good faith from owners, landlords, developers and our own inspections. It may change, and it does not form part of any contract.",
            "Prices, charges and availability are confirmed only in writing by our team. Read the listing disclaimer for more detail.",
          ],
        },
        {
          heading: "No professional advice",
          body: [
            "Content on this site, including articles and investment guidance, is general information. It is not legal, financial, tax or valuation advice. Take advice from qualified professionals before making decisions.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Do not submit false information, attempt to access restricted areas, interfere with the site's operation, or copy listing content for commercial use without our written permission.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [`Photographs, videos, text and design on this site belong to ${legalName} or its licensors.`],
        },
        {
          heading: "Liability",
          body: [
            "We take care to keep the site accurate and available but cannot guarantee it will always be error-free or uninterrupted. To the extent permitted by law, we are not liable for losses arising from reliance on website content without written confirmation from us.",
          ],
        },
        {
          heading: "Governing law",
          body: ["These terms are governed by the laws of the Federal Republic of Nigeria."],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms can be sent to ${email}.`],
        },
      ],
    },
    {
      slug: "cookies",
      title: "Cookie policy",
      description: "The cookies and similar technologies this website uses, and how to control them.",
      updated: "26 October 2026",
      sections: [
        {
          heading: "Essential",
          body: [
            "Used to keep the site secure, remember your cookie choice, and keep staff signed in to the admin area. These cannot be switched off.",
          ],
        },
        {
          heading: "Analytics (optional)",
          body: [
            "If analytics is enabled and you allow it, we use Google Analytics to understand which pages and listings are useful. IP addresses are anonymised and advertising features are switched off. Analytics cookies are not set unless you choose 'Allow analytics'.",
          ],
        },
        {
          heading: "Embedded maps and videos",
          body: [
            "Some pages embed maps from Google Maps or OpenStreetMap. These services may set their own cookies when the map loads. Property videos are hosted by us and do not set third-party cookies.",
          ],
        },
        {
          heading: "Changing your choice",
          body: ["Use the button below to clear your choice. The cookie banner will appear again so you can choose."],
        },
      ],
    },
    {
      slug: "listing-disclaimer",
      title: "Property listing disclaimer",
      description: "How to read the information in our property listings.",
      updated: "26 October 2026",
      sections: [
        {
          heading: "Information on listings",
          body: [
            "Descriptions, measurements, photographs and videos are provided to help you decide whether to inspect. Measurements are approximate. Photographs may not show the current condition of every part of a property.",
          ],
        },
        {
          heading: "Prices and charges",
          body: [
            "Prices are shown in Nigerian naira unless stated otherwise. For rentals, the rent is shown separately from caution deposits, agency, legal and service charges. All figures are confirmed in writing before you commit.",
          ],
        },
        {
          heading: "Title and documents",
          body: [
            "A listing marked 'verified' means our team has reviewed the documents the owner provided. It is not a legal opinion or a guarantee of title. All other document details are as stated by the owner and have not been verified by us.",
            "Always instruct your own lawyer to carry out searches at the relevant land registry before paying any money.",
          ],
        },
        {
          heading: "Availability",
          body: [
            "Properties can be let, sold or withdrawn at short notice. A listing appearing on the site does not guarantee it is still available. Book an inspection or contact us to confirm.",
          ],
        },
        {
          heading: "Payments",
          body: [
            `Never pay money based on website information alone. Confirm payment details by calling our office directly before making any transfer.`,
          ],
        },
        {
          heading: "Report a problem",
          body: ["If you think a listing is inaccurate or suspicious, use the 'Report it to our team' link on the property page."],
        },
      ],
    },
    {
      slug: "accessibility",
      title: "Accessibility statement",
      description: `Our commitment to making the ${brand} website usable by everyone.`,
      updated: "26 October 2026",
      sections: [
        {
          heading: "Our aim",
          body: [
            "We aim for this website to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, so that it works with keyboards, screen readers, zoom and on slow connections.",
          ],
        },
        {
          heading: "What we have done",
          body: [
            "All pages can be used with a keyboard and show a visible focus outline. Forms have labels and clear error messages. Images have text alternatives. Colours meet contrast guidelines. Animations are reduced if you have asked your device to reduce motion. Videos never play automatically with sound.",
          ],
        },
        {
          heading: "Known limitations",
          body: [
            "Some older property videos may not yet have captions. Embedded maps from third parties may not be fully accessible; the address is always given in text alongside the map.",
          ],
        },
        {
          heading: "Feedback",
          body: [`If you have difficulty using any part of the site, email ${email} or call us and we will help and fix the problem.`],
        },
      ],
    },
  ];
}
