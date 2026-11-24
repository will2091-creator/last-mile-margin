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
    Cargo: "Our delivery photos show the product in good condition when we completed the delivery.",
    Property: "Our photos show the condition of the delivery area when we completed the job.",
    Penalty: "Our delivery photos document the completed stop.",
  },
  pickup: {
    Cargo: "Damage was noted on the exception report at pickup, before the item was in our care.",
  },
  statement: { any: "We have a written statement from our crew about this delivery." },
  scans: {
    Cargo: "Our scan, GPS, and timestamp records for this stop are available.",
    Property: "Our scan, GPS, and timestamp records for this stop are available.",
    Penalty: "Our scan, GPS, and timestamp records show when we arrived and when the stop was completed.",
  },
  contact: { any: "Our call-ahead and contact log documents our contact with the customer." },
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
  const fault = ["no", "unsure", "partial"].includes(input.fault) ? input.fault : "no";

  const paragraphs = [];
  paragraphs.push(`Dear ${clean(input.recipient) || "Claims Department"},`);

  const orderRef = clean(input.orderRef);
  paragraphs.push(
    `We are writing to formally dispute claim ${claimRef}, a ${amount} ${noun} listed as "${claimType}", from our delivery on ${
      delivered ? longDate(delivered) : "[delivery date]"
    }${orderRef ? ` (reference ${orderRef})` : ""}.`,
  );

  const position = {
    no: {
      Cargo: "Our crew delivered this item in good condition, and we do not accept responsibility for this damage.",
      Property: "Our crew completed this delivery without damaging the customer's home or property, and we do not accept responsibility for this claim.",
      Penalty: "Our records do not support this penalty, and we do not accept it.",
    },
    unsure: {
      Cargo: "We have not seen evidence that this damage happened during our delivery. Until responsibility is shown, this deduction is premature.",
      Property: "We have not seen evidence that this damage happened during our delivery. Until responsibility is shown, this deduction is premature.",
      Penalty: "We have not seen records that support this penalty. Until they are provided, this deduction is premature.",
    },
    partial: {
      Cargo:
        "Before any amount is deducted, the charge should be supported by documentation of the actual cost. Any deduction should reflect the documented repair or replacement cost, not an estimate or the full retail price.",
      Property:
        "Before any amount is deducted, the charge should be supported by documentation of the actual cost. Any deduction should reflect the documented repair cost, not an estimate.",
      Penalty: "Before any amount is deducted, please share the records this penalty is based on and how the amount was calculated.",
    },
  };
  paragraphs.push(position[fault][category]);

  if (evidence.length) {
    const sentences = evidence.map((item) => EVIDENCE_SENTENCES[item.id][category] || EVIDENCE_SENTENCES[item.id].any).filter(Boolean);
    paragraphs.push(`${sentences.join(" ")} We can provide copies of these records on request.`);
  }

  if (!isPenalty && daysLater != null && daysLater >= 2) {
    paragraphs.push(
      `This was first reported ${daysLater} days after our delivery. Nothing provided so far shows that the damage happened during our delivery rather than before or after it.`,
    );
  }

  if (requests.length) {
    paragraphs.push(`To review this claim, please send us ${joinList(requests.map((item) => item.phrase))}.`);
  }

  const days = Math.round(Number(clean(input.responseDays)));
  const deadline = Number.isFinite(days) && days > 0 ? ` We would appreciate a response within ${days} business ${days === 1 ? "day" : "days"}.` : "";
  if (fault === "partial") {
    paragraphs.push(`Please hold this ${noun} until the documentation is provided, and limit any deduction to the documented cost.${deadline}`);
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
  if (fault === "no" && category !== "Penalty" && (has("pod") || has("photos"))) {
    return "Proof of a clean delivery. A signed POD or photos put the burden on them to show the damage happened on your watch.";
  }
  if (category !== "Penalty" && daysLater != null && daysLater >= 2) {
    return `Timing. It was reported ${daysLater} days after delivery, so nothing ties it to your crew yet.`;
  }
  if (has("pickup")) return "The damage was documented at pickup, before the item was in your care.";
  if (category === "Penalty" && (has("scans") || has("contact"))) return "Your own records contradict the reason for the penalty.";
  if (fault === "partial") return "Limit it to the documented cost. Ask for the itemized invoice before anything is deducted.";
  if (requests > 0) return "The claim isn't backed up yet. Ask for their proof before accepting the deduction.";
  return "Responsibility hasn't been shown. Ask them to prove it before anything is deducted.";
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
