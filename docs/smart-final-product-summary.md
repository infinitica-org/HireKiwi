# Smart — Product Summary

---

## What Smart is

Smart is an **Intellectual Talent Network** and role-specific readiness verification platform. It unites candidates, academic institutions, and employers onto a single verified talent graph where every profile claim is backed by unfakeable evidence (projects, repositories, manager vouchers, and proctored evaluations). It assesses candidates against real competency requirements for specific job tracks — not generic employability scores — and issues criterion-referenced Gold / Silver / Bronze certificates that are cryptographically signed (HMAC-SHA256), student-controlled, and publicly verifiable. Through semantic vector matching (`pgvector`), Smart directly connects verified talent to high-fit employer opportunities.

**Positioning statement**

> For placement offices, students, and employers who are done trusting unverified resumes and opaque employability scores — Smart is an Intellectual Talent Network that certifies exactly what a specific role requires, backs every claim with unfakeable evidence, and matches verified readiness directly to hiring demand. Unlike legacy assessment platforms that sell scale and unverified generality, Smart provides precision, proof, and a living talent network.

**One-liner**
Smart is an Intellectual Talent Network that proves who is actually ready for the job — backed by unfakeable evidence and cryptographic proof.

---

## The three values that are the product, not the marketing

- **Precision over breadth** — one role track done rigorously beats five done shallowly. Certificates are issued per specialization, not as one generic score.
- **Transparency over authority** — scoring methodology and cutoffs are visible, not a locked black box. A skeptical academic council member or recruiter can click into how a tier was decided.
- **Honesty over inflation** — every report carries a confidence note stating the real sample size and calibration status behind it. Nothing is claimed as "standardized" before it's actually earned.

---

## Current focus: MBA (HR, Finance, Marketing, Operations, Business Analytics)

### Architecture: one foundation, five specialization tracks

**Foundation layer** (shared, ~25–30% of the score): business communication, quantitative & data interpretation, case-based business judgment, stakeholder/ethical reasoning.

**Specialization layer** (~70–75%, track-specific):

| Track              | Core competencies                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Finance            | Financial statement analysis, valuation & capital budgeting, applied financial modeling, working-capital/risk reasoning      |
| Business Analytics | SQL/data querying, statistical reasoning, data-to-insight communication, applied case: dataset → recommendation              |
| Marketing          | Market sizing & segmentation, positioning/campaign case judgment, marketing-metrics literacy, consumer-behavior reasoning    |
| Operations         | Process/supply-chain problem solving, quantitative ops, quality/process-improvement reasoning, negotiation scenario judgment |
| HR                 | Recruitment/talent scenario judgment, employee-relations case, HR-metrics literacy, policy/compliance judgment               |

**Launch sequencing — two validated, three available:**

| Status                      | Tracks                      | Why                                                                                                                              |
| --------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Validated lead              | Finance, Business Analytics | Quantifiable, verifiable tasks — easiest to score rigorously and to correlate against real hiring outcomes at small sample sizes |
| Available, labeled as newer | Marketing, Operations, HR   | More judgment-based, harder to calibrate early — shipped honestly flagged as less-proven rather than held back entirely          |

**Track assignment:** institution pre-assigns each student's specialization based on declared major/elective; students may voluntarily add one additional track. Foundation is taken once.

**Item format:** quantifiable tasks (financial models, SQL queries, ops calculations) wherever a track allows it — hardest to game, cleanest signal. Judgment-heavy areas (HR, marketing, ops scenarios) use structured short-response items scored against a rubric, not MCQ.

---

## Certification model

- Gold / Silver / Bronze, issued **per specialization track**, not per degree.
- **Criterion-referenced**, not purely norm-referenced — tiers are set against real regional role requirements, not just a percentile rank against peers.
- Every report carries a **confidence note**: real sample size, calibration status, and how it will sharpen over subsequent cycles.

---

## The trust chain — what actually makes an employer act on it

A certificate nobody trusts is just an elaborate report card. Four lightweight mechanisms carry the credibility, without depending on a full employer consortium in v1:

1. **Student-controlled, verifiable certificate** — a shareable link/QR code the student chooses to send, not a platform-pushed profile. Keeps the student in control and avoids triggering a heavier data-sharing consent architecture before it's needed.
2. **Employer verification page** — shows the tier, the specific competencies covered, the methodology, and the confidence note. This is the actual "convince employers to hire" mechanism in v1.
3. **3–5 named regional calibration employers per validated-lead track** — not a full consortium, just enough real provenance ("we consulted on what this measures") to separate the certificate from a generic badge.
4. **A published, per-track correlation between certificate tier and real interview/offer outcomes**, updated every placement cycle — the feedback loop that makes the whole system more honest over time instead of static.

---

## The one metric that decides if it's working

Not assessments taken, not institutions signed — **the interview/offer conversion rate for Gold-tier students versus the cohort baseline.** If that gap isn't real and growing within two placement cycles, the fix is better grounding, not more tracks or more polish.

---

## Business model

- **Institution pays** — per-cohort or per-student licensing, paid by the placement office/institution, mirroring the proven category structure (assessment stays free or near-free to students, monetization happens on the paying side).
- **Optional student add-on** — a nominal fee for a deeper diagnostic report, validated willingness-to-pay signal.
- **Deferred to later phases:** full regional employer consortium, employer-side paid access, academia faculty-training suite, additional role clusters (including IT/SDE-1, the originally scoped track) — each reintroduced once the MBA validated-lead tracks prove the correlation claim.

---

## What v1 deliberately does not include

Self-serve, on-demand assessment generation; a full employer consortium; platform-side student profile sharing; equal-depth validation across all five specializations; faculty-facing features; multi-vertical expansion beyond MBA. Each is a real, credible next phase — not a v1 blocker.

---

## Open decisions still worth locking

- Final brand name (has moved between SMART, Talenzive, and Smart across this process — needs a trademark/domain check before it's used externally again).
- Whether the confidence note is shown to students as well as institutions (leaning yes, for consistency with "student report comes first").
- Identity of the first 3–5 calibration employers for Finance and Business Analytics, and who makes that introduction.
