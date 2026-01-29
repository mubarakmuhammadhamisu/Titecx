export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "Explore the platform and preview selected lessons.",
    price: "₦0",
    features: [
      "Limited course previews",
      "Community access",
      "No credit card required",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    id: "single",
    name: "Single Course",
    description: "Buy one course and get lifetime access.",
    price: "₦9,999",
    features: [
      "Lifetime access",
      "All course updates",
      "Certificate of completion",
    ],
    cta: "Buy Course",
    href: "/register",
    highlighted: true,
  },
  {
    id: "all-access",
    name: "All Access",
    description: "Unlimited access to all courses on the platform.",
    price: "₦24,999",
    features: [
      "All courses included",
      "New courses added automatically",
      "Priority support",
    ],
    cta: "Go All Access",
    href: "/register",
    highlighted: false,
  },
];
