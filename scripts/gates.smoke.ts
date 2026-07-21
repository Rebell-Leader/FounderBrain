import { verifySubstring, verifyMergeLegality, clampUrgency, applyUrgencyFloor,
  verifyNoVanish, promiseFirewall, recipientLock, sendInvariants,
  stripUncitedSentences, shouldSkipLLM, withRepairRetry, CrossReference,
  type SignalRow } from "../src/lib/gates";
import { z } from "zod";
let failures = 0;

const assert = (cond: boolean, name: string) => { if (!cond) { console.error("FAIL:", name); failures++; } else console.log("ok:", name); };

// substring
assert(verifySubstring("procurement  pressure", "she flagged Procurement pressure on tools").ok, "substring-normalized");
assert(!verifySubstring("gave us a discount", "she flagged procurement pressure").ok, "substring-reject");

// merge legality
const sigs = new Map<string, SignalRow>([
  ["s1", { id:"s1", kind:"failed_payment", base_urgency:4, contact_id:"c1", company_key:"datawise", watch_contact_edge:[], source:"stripe" }],
  ["s2", { id:"s2", kind:"at_risk_email", base_urgency:3, contact_id:"c1", company_key:"datawise", watch_contact_edge:[], source:"gmail" }],
  ["s3", { id:"s3", kind:"quiet_lead", base_urgency:3, contact_id:"c2", company_key:"shipfleet", watch_contact_edge:[], source:"notes" }],
  ["s4", { id:"s4", kind:"competitor_move", base_urgency:2, contact_id:null, company_key:null, watch_contact_edge:["c1"], source:"watchlist" }],
]);
assert(verifyMergeLegality(["s1","s2"], sigs).ok, "merge-same-contact");
assert(!verifyMergeLegality(["s1","s3"], sigs).ok, "merge-illegal-rejected");
assert(verifyMergeLegality(["s1","s4"], sigs).ok, "merge-watch-edge");

// urgency
assert(clampUrgency(5, [4,3], true) === 5, "clamp-allows-bonus");
assert(clampUrgency(1, [4], false) === 3, "clamp-floor-base-minus-1");
assert(applyUrgencyFloor("failed_payment", 2) === 4, "money-floor");

// no-vanish
const xref: CrossReference = { merged_signals: [{ member_signal_ids:["s1","s2"], kind:"churn_risk", title:"t", merged_narrative:"n", urgency:5, urgency_reason:"r", revenue_at_stake_eur:null }], below_line: [{ signal_id:"s3", reason:"quiet" }] };
assert(!verifyNoVanish(["s1","s2","s3","s4"], xref).ok, "vanish-detected");
assert(verifyNoVanish(["s1","s2","s3"], xref).ok, "no-vanish-ok");

// promise firewall
assert(!promiseFirewall("happy to give you 20% off to stay", "").ok, "promise-blocked");
assert(promiseFirewall("I already promised you a refund last week", "I will send your refund tomorrow").ok, "promise-authorized");
assert(promiseFirewall("let's find a plan that fits", "").ok, "benign-passes");

// recipient lock
assert(recipientLock(["marta@datawise.io"], [], [], ["marta@datawise.io","alex@lingoloop.app"], null).ok, "recipient-thread");
assert(!recipientLock(["evil@attacker.com"], [], [], ["marta@datawise.io"], "marta@datawise.io").ok, "recipient-blocked");
assert(!recipientLock(["marta@datawise.io"], [], ["shadow@x.com"], ["marta@datawise.io"], null).ok, "bcc-forbidden");

// send invariants
assert(!sendInvariants({ actionStatus:"proposed", humanApprovedAt:null, sendsToday:0, contactLocalHour:10, killSwitchSends:false }).ok, "no-approval-blocked");
assert(!sendInvariants({ actionStatus:"approved", humanApprovedAt:new Date(), sendsToday:0, contactLocalHour:22, killSwitchSends:false }).ok, "outside-hours");
assert(sendInvariants({ actionStatus:"approved", humanApprovedAt:new Date(), sendsToday:3, contactLocalHour:10, killSwitchSends:false }).ok, "send-ok");

// citation stripping
const stripped = stripUncitedSentences("Marta flagged procurement on June 24 [i1]. This is uncited speculation. She wants a case study [i2].", new Set(["[i1]","[i2]"]));
assert(!stripped.includes("speculation") && stripped.includes("[i1]") && stripped.includes("[i2]"), "uncited-stripped");

// email pre-filter
assert(shouldSkipLLM({ "list-unsubscribe": "<mailto:x>" }, "news@substack.com"), "skip-newsletter");
assert(shouldSkipLLM({}, "no-reply@calendly.com"), "skip-noreply");
assert(!shouldSkipLLM({}, "marta@datawise.io"), "keep-human");

// repair retry
const schema = z.object({ n: z.number() });
let calls = 0;
const res = await withRepairRetry(schema, async (hint) => { calls++; return hint ? { n: 7 } : { n: "bad" }; });
assert(res.ok && calls === 2, "repair-retry-recovers");

console.log("SMOKE DONE");
if (failures > 0) throw new Error(failures + " smoke tests failed");
