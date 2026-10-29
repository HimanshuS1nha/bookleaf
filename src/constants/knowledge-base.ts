import "server-only";

import { TicketCategory } from "@/constants/ticket";

// BookLeaf's support policies, given to the model when drafting replies.
// Split by ticket category so each call only carries the section it needs
// instead of the whole knowledge base.

export const COMPANY_OVERVIEW = `- BookLeaf Publishing is a self-publishing company operating in India and the US.
- Publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution and royalty management for its authors.
- The in-house printing facility and warehouse are in Delhi. Print partners include Repro India and Epitome Books.`;

export const TONE_GUIDELINES = `- Always empathetic and professional. Authors are our partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: include actual numbers, dates and statuses wherever possible rather than vague reassurances.
- If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If the issue needs escalation or investigation, give a clear timeline ("Our team will look into this and get back to you within 48 hours") rather than open-ended promises.
- Always end with a clear next step for the author and/or the BookLeaf team.`;

export const KNOWLEDGE_BASE: Record<TicketCategory, string> = {
  royalty_and_payments: `Royalty policy:
- 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold is ₹1,000. Smaller balances roll over to the next quarter.
- Payouts are made by bank transfer to the account linked in the author's dashboard.
- Authors can see a detailed royalty breakdown in their dashboard, with sales per platform.

How to handle common requests:
- "I haven't received any royalty": acknowledge the frustration, explain the quarterly cycle and 45-day payout window, ask them to check their bank details are linked, and give the specific next payout date. If the payment is genuinely overdue, escalate with a 48-hour resolution timeline.
- "My royalty seems too low": explain the net profit calculation (MRP minus printing, platform commission and shipping) and offer a detailed line-by-line royalty breakdown. Don't be defensive, offer transparency.`,

  isbn_and_metadata: `ISBN policy:
- Every book published through BookLeaf gets a unique ISBN assigned by BookLeaf.
- ISBNs are registered under BookLeaf's publisher imprint. Authors who want an ISBN under their own imprint must obtain it independently.
- ISBN errors (duplicate, wrong book linked, mismatch between listing and print) are high priority and escalated to the production team.
- Metadata updates (description, author bio and similar) can be submitted through the dashboard or by emailing the BookLeaf team. Changes typically reflect on platforms within 3–5 business days.

How to handle common requests:
- "The ISBN on Amazon differs from the physical copy": treat it as high priority, acknowledge it's a serious data issue, confirm it's being escalated to the production team immediately, and give a 48-hour resolution timeline.`,

  printing_and_quality: `Printing and quality:
- In-house printing handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.
- Standard print turnaround is 5–7 business days from order confirmation.
- For quality issues (misprints, binding defects, colour inconsistency), BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy.

How to handle common requests:
- "My author copies have poor print quality": apologise sincerely, ask for photos of the defective copies, confirm a free reprint once verified, and give a 5–7 business day timeline for the reprint.`,

  distribution_and_availability: `Distribution and availability:
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- A book showing as unavailable on a platform usually means a stock sync issue. BookLeaf's team can trigger a re-sync within 24–48 hours.

How to handle common requests:
- "My book shows Currently Unavailable on Amazon": explain it's typically a stock sync issue, confirm a re-sync is being triggered with the distribution team, and set the expectation of 24–48 hours for it to go live again.`,

  book_status_and_production_updates: `Production stages:
- Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are updated by email at each stage. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
- Once published, new listings typically go live within 7–10 business days.

How to handle common requests:
- "My book has been in typesetting for weeks": check the actual production status. If it's delayed, be honest about why (for example waiting on proof approval) and give a specific updated timeline. Don't blame the author even if the delay is on their side, frame it collaboratively.`,

  general_inquiry: `General:
- Metadata updates (book description, author bio and similar) can be submitted through the dashboard or by emailing the BookLeaf team. Changes typically reflect on platforms within 3–5 business days.
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.
- Royalties are paid quarterly, within 45 days of the quarter ending, with a ₹1,000 minimum payout.`,
};
