/**
 * Certifications shown on /certifications.
 *
 * `credentialUrl` is required for every entry — every cert must be verifiable.
 * `image` is optional — if set, the card uses it as a square badge;
 *   otherwise the card renders a generated initials monogram.
 */
export interface Certification {
  slug: string;
  title: string;
  issuer: string;
  /** Year + month, formatted however you like (e.g. "May 2025"). */
  issued: string;
  /** Optional human-readable area / focus. */
  category?: string;
  /** Verifier link (every awarded cert must have one). */
  credentialUrl: string;
  /** Optional badge image path (place under /public/images/certs/). */
  image?: string;
  /** Optional 1-line summary. */
  description?: string;
  /** Set true if currently in progress / not yet awarded. */
  inProgress?: boolean;
}

export const certifications: Certification[] = [
  // ── Google Cloud Skills Boost — Digital Leader track ──────────────────
  {
    slug: "gcloud-scaling-operations",
    title: "Scaling with Google Cloud Operations",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "Cloud",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23757441",
    description:
      "Reliability, monitoring, financial governance, and sustainability in cloud operations.",
  },
  {
    slug: "gcloud-trust-security",
    title: "Trust and Security with Google Cloud",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "Cloud",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23757191",
    description:
      "Cloud security model, identity, compliance, and shared-responsibility fundamentals.",
  },
  {
    slug: "gcloud-modernize-infra",
    title: "Modernize Infrastructure and Applications with Google Cloud",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "Cloud",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23756869",
    description:
      "Compute, networking, and modernization paths — VMs, containers, serverless, and APIs.",
  },
  {
    slug: "gcloud-data-transformation",
    title: "Exploring Data Transformation with Google Cloud",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "Cloud",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23756094",
    description:
      "Data lifecycle, analytics, and ML services on Google Cloud — turning raw data into business value.",
  },
  {
    slug: "gcloud-digital-transformation",
    title: "Digital Transformation with Google Cloud",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "Cloud",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23756028",
    description:
      "Why companies adopt cloud, how Google Cloud differs, and the foundations of digital transformation.",
  },

  // ── Google Cloud Skills Boost — AI / AI Hypercomputer track ──────────
  {
    slug: "gcloud-innovating-ai",
    title: "Innovating with Google Cloud Artificial Intelligence",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23716089",
    description:
      "AI on Google Cloud — from generative AI services to building intelligent applications.",
  },
  {
    slug: "gcloud-ai-networking",
    title: "AI Infrastructure: Networking Techniques",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23654350",
    description:
      "High-performance networking patterns for AI training and inference workloads.",
  },
  {
    slug: "gcloud-ai-storage",
    title: "AI Infrastructure: Storage Options",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23653987",
    description:
      "Storage architectures for ML datasets, checkpoints, and model artifacts at scale.",
  },
  {
    slug: "gcloud-ai-deployment",
    title: "AI Infrastructure: Deployment Types",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23653571",
    description:
      "Choosing between managed, custom, and serverless deployment models for AI workloads.",
  },
  {
    slug: "gcloud-ai-tpus",
    title: "AI Infrastructure: Cloud TPUs",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23652915",
    description:
      "Tensor Processing Units — when to use them, how they scale, and ML workload fit.",
  },
  {
    slug: "gcloud-ai-gpus",
    title: "AI Infrastructure: Cloud GPUs",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23651880",
    description:
      "GPU options on Google Cloud and how to match compute to training and inference needs.",
  },
  {
    slug: "gcloud-ai-hypercomputer-intro",
    title: "AI Infrastructure: Introduction to AI Hypercomputer",
    issuer: "Google · Skills Boost",
    issued: "2025",
    category: "AI",
    credentialUrl:
      "https://www.skills.google/public_profiles/c8da0325-f520-4c16-b8ba-9ad5fdbb4d39/badges/23651307",
    description:
      "Foundations of AI Hypercomputer — Google Cloud's integrated AI infrastructure stack.",
  },
];

export function getCertBySlug(slug: string): Certification | undefined {
  return certifications.find((c) => c.slug === slug);
}
