// Template dispute letter for the public chargeback tool. Runs entirely in the browser.
// Rule (same as the app's AI Dispute Engine): only cite proof the contractor says they
// have, never admit fault, and always make a clear ask.

const ALL = ["Cargo", "Property", "Penalty"];

export const CATEGORIES = [
  { value: "Cargo", label: "Product damage" },
  { value: "Property", label: "Property damage" },
  { value: "Penalty", label: "Service penalty" },
];

export const FAULT_OPTIONS = [
  { value: "no", label: "Not our fault" },
  { value: "unsure", label: "Not sure" },
  { value: "partial", label: "Partly our fault" },
  { value: "yes", label: "Our fault" },
];

export const EVIDENCE = [
  { id: "pod", label: "Signed proof of delivery with no damage noted", categories: ALL },
  { id: "photos", label: "Delivery photos", hint: "The product, install area, or home at drop-off.", categories: ALL },
  { id: "pickup", label: "Damage noted at pickup", hint: "On the exception report or bill of lading, before it was in your care.", categories: ["Cargo"] },
  { id: "statement", label: "Written statement from the crew", categories: ALL },
  { id: "scans", label: "Scan, GPS, or timestamp records", categories: ALL },
  { id: "contact", label: "Call-ahead or customer contact log", categories: ALL },
];

export const REQUESTS = [
  { id: "damagePhotos", label: "Photos of the reported damage", phrase: "photos of the reported damage", categories: ["Cargo", "Property"] },
  { id: "invoice", label: "Itemized repair or replacement invoice", phrase: "an itemized repair or replacement invoice", categories: ["Cargo", "Property"] },
  { id: "complaint", label: "The customer's original complaint", phrase: "the customer's original complaint", categories: ALL },
  {
    id: "proofDamage",
    label: "Proof it happened during your delivery",
    phrase: "evidence that the damage happened during our delivery",
    categories: ["Cargo", "Property"],
  },
  {
    id: "proofPenalty",
    label: "The records the penalty is based on",
    phrase: "the records this penalty is based on, such as scan times and the delivery window",
    categories: ["Penalty"],
  },
];

const EVIDENCE_SENTENCES = {
  pod: {
    Cargo: "The customer signed the proof of delivery with no damage noted.",
    Property: "The customer signed the proof of delivery with no damage noted.",
    Penalty: "The customer signed the proof of delivery for this stop.",
  },
  photos: {
    Cargo: "We have photos from the delivery.",
    Property: "We have photos from the delivery.",
    Penalty: "We have photos from the delivery.",
  },
  pickup: {
    Cargo: "Damage was documented at pickup.",
  },
  statement: { any: "We have a written statement from our crew about this delivery." },
  scans: {
    Cargo: "We have scan, GPS, or timestamp records for this stop.",
    Property: "We have scan, GPS, or timestamp records for this stop.",
    Penalty: "We have scan, GPS, or timestamp records for this stop.",
  },
  contact: { any: "We have a call-ahead or customer contact log for this stop." },
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const clean = (value) => String(value ?? "").trim();
const or = (value, placeholder) => clean(value) || `[${placeholder}]`;

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

const longDate = (date) => date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function joinList(items) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function forCategory(list, category) {
  return list.filter((item) => item.categories.includes(category));
}

export function buildDisputeLetter(input) {
  const category = ALL.includes(input.category) ? input.category : "Cargo";
  const isPenalty = category === "Penalty";
  const noun = isPenalty ? "penalty" : "deduction";

  const amountNumber = Number(clean(input.amount).replace(/[$,\s]/g, ""));
  const amount = clean(input.amount) && Number.isFinite(amountNumber) ? usd.format(amountNumber) : "[amount]";
  const claimRef = or(input.claimId, "claim number");
  const claimType = clean(input.claimType) || CATEGORIES.find((c) => c.value === category).label;

  const delivered = parseDate(input.deliveryDate);
  const reported = parseDate(input.reportedDate);
  const daysLater = delivered && reported ? Math.round((reported - delivered) / 86400000) : null;

  const evidence = forCategory(EVIDENCE, category).filter((item) => (input.evidence || []).includes(item.id));
  const requests = forCategory(REQUESTS, category).filter((item) => (input.requests || []).includes(item.id));
  const fault = FAULT_OPTIONS.some((option) => option.value === input.fault) ? input.fault : "unsure";
  const reviewAmount = fault === "partial" || fault === "yes";

  const paragraphs = [];
  paragraphs.push(`Dear ${clean(input.recipient) || "Claims Department"},`);

  const orderRef = clean(input.orderRef);
  paragraphs.push(
    `We are writing to formally dispute claim ${claimRef}, a ${amount} ${noun} listed as "${claimType}", from our delivery on ${
      delivered ? longDate(delivered) : "[delivery date]"
    }${orderRef ? ` (reference ${orderRef})` : ""}.`,
  );

  if (reviewAmount) {
    paragraphs.push(`Please provide the basis for this ${noun} and an itemized explanation of how it was calculated.`);
  } else if (fault === "no") {
    paragraphs.push(`We dispute the basis for this ${noun}. Please provide the records you relied on when applying it.`);
  } else {
    paragraphs.push(`Please provide the records needed to review whether this ${noun} is supported.`);
  }

  if (evidence.length) {
    const sentences = evidence.map((item) => EVIDENCE_SENTENCES[item.id][category] || EVIDENCE_SENTENCES[item.id].any).filter(Boolean);
    paragraphs.push(`${sentences.join(" ")} We can provide copies of these records on request.`);
  }

  if (!isPenalty && daysLater != null && daysLater >= 2) {
    paragraphs.push(
      `The report date is ${daysLater} days after delivery. Please include any records that establish when the damage occurred.`,
    );
  }

  if (requests.length) {
    paragraphs.push(`To review this claim, please send us ${joinList(requests.map((item) => item.phrase))}.`);
  }

  const days = Math.round(Number(clean(input.responseDays)));
  const deadline = Number.isFinite(days) && days > 0 ? ` We would appreciate a response within ${days} business ${days === 1 ? "day" : "days"}.` : "";
  if (reviewAmount) {
    paragraphs.push(`Please reverse any unsupported portion of the ${amount} ${noun} on our next settlement and provide the documentation for any amount you maintain is due.${deadline}`);
  } else {
    paragraphs.push(
      `We ask that the ${amount} ${noun} be reversed and refunded on our next settlement. If you believe the charge is valid, please send ${
        requests.length ? "the documentation above" : "the documentation that supports it"
      } so we can review it.${deadline}`,
    );
  }

  paragraphs.push("Thank you for your prompt attention to this matter.");

  const signature = [
    "Sincerely,",
    or(input.name, "Your name"),
    clean(input.title),
    or(input.company, "Company name"),
    clean(input.phone),
    clean(input.email),
  ].filter(Boolean);
  paragraphs.push(signature.join("\n"));

  return {
    subject: `Dispute of claim ${claimRef}: ${claimType} (${amount})`,
    body: paragraphs.join("\n\n"),
    angle: pickAngle({ category, fault, evidence: evidence.map((e) => e.id), requests: requests.length, daysLater }),
    gaps: findGaps({ category, input, evidence: evidence.map((e) => e.id), requests: requests.length }),
  };
}

function pickAngle({ category, fault, evidence, requests, daysLater }) {
  const has = (id) => evidence.includes(id);
  if (fault === "partial" || fault === "yes") return "Review the amount charged. Ask for an itemized calculation and reversal of any unsupported amount.";
  if (has("pickup")) return "The damage was documented at pickup. Include the record that shows when it was noted.";
  if (category !== "Penalty" && has("pod")) return "The customer signed the proof of delivery with no damage noted. Include a copy.";
  if (category !== "Penalty" && daysLater != null && daysLater >= 2) {
    return `The report came ${daysLater} days after delivery. Ask for records that establish when the damage occurred.`;
  }
  if (has("photos")) return "Include the delivery photos so the claims team can review what they show.";
  if (category === "Penalty" && (has("scans") || has("contact"))) return "Include the records you have for the stop and ask how the penalty was assessed.";

  if (requests > 0) return "Ask the claims team for the records you selected.";
  return "Ask the claims team to explain the basis for the deduction.";
}

function findGaps({ category, input, evidence, requests }) {
  const gaps = [];
  const has = (id) => evidence.includes(id);
  if (category !== "Penalty" && !has("pod")) gaps.push("Look for a signed proof of delivery. One with no damage noted is hard to argue with.");
  if (!has("photos")) gaps.push("If your crew took any photos at drop-off, attach them.");
  if (!has("statement")) gaps.push("Get a short written statement from the crew while the delivery is fresh.");
  if (category !== "Penalty" && !clean(input.reportedDate)) gaps.push("Add the date they reported it. A late report can be your best argument.");
  if (!requests) gaps.push("Ask for their proof, like damage photos or an itemized invoice. A deduction without it is easier to challenge.");
  if (!clean(input.claimId) || !clean(input.amount) || !clean(input.deliveryDate)) {
    gaps.push("Fill in the claim number, amount, and delivery date so the letter has no blanks.");
  }
  return gaps;
}
