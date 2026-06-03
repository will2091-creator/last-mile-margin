export const documentVaultData = [
  { id: "doc-llc", name: "LLC / Formation Documents", category: "Business Documents", required: true, status: "Uploaded", expiration: "N/A", owner: "Will's Fleet", notes: "Stored for business verification." },
  { id: "doc-ein", name: "EIN Confirmation", category: "Business Documents", required: true, status: "Uploaded", expiration: "N/A", owner: "Will's Fleet", notes: "Needed for retailer onboarding." },
  { id: "doc-w9", name: "W-9", category: "Business Documents", required: true, status: "Uploaded", expiration: "N/A", owner: "Will's Fleet", notes: "Review annually." },
  { id: "doc-coi", name: "Certificate of Insurance", category: "Insurance", required: true, status: "Expiring Soon", expiration: "Jun 15, 2026", owner: "Will's Fleet", notes: "Retailers need updated COI before renewal." },
  { id: "doc-cargo", name: "Cargo Insurance", category: "Insurance", required: true, status: "Expiring Soon", expiration: "Jun 7, 2026", owner: "Team B", notes: "Cargo certificate renewal pending." },
  { id: "doc-auto", name: "Auto Insurance", category: "Insurance", required: true, status: "Uploaded", expiration: "Sep 30, 2026", owner: "Truck 226", notes: "Policy active." },
  { id: "doc-dot", name: "DOT Inspection", category: "DOT Documents", required: true, status: "Expired", expiration: "May 20, 2026", owner: "Truck 204", notes: "Route interruption risk until renewed." },
  { id: "doc-medical", name: "Driver Medical Card", category: "Driver Files", required: true, status: "Missing", expiration: "Missing", owner: "Mike S.", notes: "Needed before dispatch approval." },
  { id: "doc-mvr", name: "MVR", category: "Driver Files", required: true, status: "Uploaded", expiration: "Aug 1, 2026", owner: "Marcus J.", notes: "Clean record on file." },
  { id: "doc-rate", name: "Lowe's Rate Card", category: "Rate Cards", required: true, status: "Uploaded", expiration: "Dec 31, 2025", owner: "Lowe's Appliance Delivery", notes: "Use for renewal analysis." },
  { id: "doc-retailer", name: "Retailer Compliance Packet", category: "Retailer Compliance Documents", required: true, status: "Uploaded", expiration: "Jan 31, 2026", owner: "Home Depot", notes: "Includes service requirements." },
];

export const complianceRiskData = [
  { id: "risk-dot", title: "Expired DOT inspection", detail: "Truck 204 inspection expired May 20, 2026.", severity: "Critical", owner: "Truck 204", action: "Upload renewed inspection before dispatch." },
  { id: "risk-medical", title: "Missing medical card", detail: "Mike S. is missing a required driver medical card.", severity: "High", owner: "Mike S.", action: "Collect and upload medical card." },
  { id: "risk-cargo", title: "Cargo insurance expiring", detail: "Cargo Insurance expires Jun 7, 2026.", severity: "Medium", owner: "Team B", action: "Request updated certificate." },
  { id: "risk-photos", title: "Daily photo compliance", detail: "Team C is missing today's readiness photo.", severity: "Medium", owner: "Team C", action: "Upload daily route photo." },
];
