const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kendrickserrano.dev";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kendrick U. Serrano",
  alternateName: "Kendrick Serrano",
  url: BASE_URL,
  email: "mailto:kendrickserrano7@gmail.com",
  jobTitle: "Information Technology Student & Web/App Developer",
  description:
    "Information Technology student at Western Mindanao State University. UI/UX designer and full-stack web/app developer building accessible, well-crafted digital experiences.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tugbungan, Zamboanga City",
    addressCountry: "PH",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Western Mindanao State University",
  },
  sameAs: [
    "https://github.com/chirdnek",
    "https://linkedin.com/in/kendrickserrano",
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
