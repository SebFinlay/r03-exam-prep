/* ═══════════════════════════════════════════════════
   R03 EXAM PREP — COMPLETE APPLICATION
   All flashcard data + full app logic
═══════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════
   SUPABASE CONFIGURATION
═══════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://pqglsdogxxsksobqzapw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZ2xzZG9neHhza3NvYnF6YXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTM2ODAsImV4cCI6MjA5NzQyOTY4MH0.u7drrz8TjCOfe6bSYRJdF5XFB_TjW7L4pUwtTpKpMoc';

let supabaseClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase client failed to initialize:', e);
}

let currentUser = null;       // Supabase auth user object, or null
let syncStatus = 'local';     // 'local' | 'syncing' | 'synced' | 'error'
let isOnline = navigator.onLine;
let pendingSyncQueue = [];    // queued writes while offline/syncing
let syncDebounceTimer = null;

window.addEventListener('online', () => { isOnline = true; flushSyncQueue(); });
window.addEventListener('offline', () => { isOnline = false; setSyncStatus('local'); });

/* ───────────────────────────────────────────────────
   FLASHCARD DATA
─────────────────────────────────────────────────── */
const CARDS_RAW = [
  // ══════════════════════════════════════════════════
  // SECTION 1: INCOME TAX FOUNDATIONS
  // ══════════════════════════════════════════════════
  {
    id: 1, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "In what order must income be taxed for income tax purposes?",
    a: "Non-savings income first (employment, pensions, rental, trading), then savings income, then dividend income, then chargeable gains on life assurance policies (always top).\n\nThis order determines which allowances and rates apply to each type of income."
  },
  {
    id: 2, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates and bands for 2025/26 (non-savings, non-dividend income)?",
    a: "Basic rate: 20% on £0–£37,700\nHigher rate: 40% on £37,701–£125,140\nAdditional rate: 45% above £125,140\n\nThese bands sit above the personal allowance of £12,570."
  },
  {
    id: 3, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the dividend tax rates for 2025/26?",
    a: "Basic rate: 8.75%\nHigher rate: 33.75%\nAdditional rate: 39.35%\nFirst £500 dividend allowance at 0% for ALL taxpayers (regardless of rate)."
  },
  {
    id: 4, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Personal Savings Allowance (PSA) for 2025/26?",
    a: "Basic-rate taxpayer: £1,000\nHigher-rate taxpayer: £500\nAdditional-rate taxpayer: £0 (nil — no PSA)\n\nSavings income within the PSA is taxed at 0%."
  },
  {
    id: 5, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the starting rate for savings income, and when does it apply?",
    a: "0% on up to £5,000 of savings income — but ONLY if non-savings taxable income (after personal allowance) is less than £5,000.\n\nIf non-savings income exceeds £5,000, this rate is unavailable entirely."
  },
  {
    id: 6, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A taxpayer has non-savings taxable income of £15,000 (after personal allowance). Can they use the 0% starting rate on savings income?",
    a: "No. The 0% starting rate on savings income only applies when non-savings taxable income is BELOW £5,000. At £15,000 it is completely unavailable.\n\nMany candidates incorrectly think this rate is always available."
  },
  {
    id: 7, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How do gift aid donations and personal pension contributions (paid net) affect the income tax calculation?",
    a: "They extend the BASIC RATE BAND and HIGHER RATE BAND by the gross amount of the payment.\n\nExample: £800 net pension → gross £1,000 → basic rate band becomes £38,700; higher rate band becomes £126,140.\n\nThis gives higher/additional rate taxpayers full marginal relief."
  },
  {
    id: 8, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the personal allowance for 2025/26 and how is it withdrawn?",
    a: "£12,570. Reduced by £1 for every £2 of adjusted net income above £100,000. Fully withdrawn at £125,140.\n\nAdjusted net income = total income minus gross pension contributions and gross gift aid donations."
  },
  {
    id: 9, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What is the effective marginal income tax rate for someone with adjusted net income between £100,000 and £125,140?",
    a: "60%. They pay 40% higher rate tax PLUS lose £1 of personal allowance for every £2 earned — that lost allowance is also taxed at 40%, creating an extra 20%.\n\nTotal = 40% + 20% = 60% effective rate. This is the personal allowance trap."
  },
  {
    id: 10, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How can a taxpayer reduce the 60% personal allowance trap (income £100,000–£125,140)?",
    a: "Make gross pension contributions (via relief at source) or gift aid donations. These reduce adjusted net income, restoring the personal allowance.\n\nResult: effective tax relief of 60p in the £1 on pension contributions made in this band."
  },
  {
    id: 11, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the marriage allowance for 2025/26 and who can use it?",
    a: "One spouse/civil partner can transfer £1,260 (10% of personal allowance) to the other, giving the recipient a TAX REDUCTION of £252.\n\nOnly available if the RECIPIENT does not pay tax at higher or additional rate."
  },
  {
    id: 12, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "How does gift aid work for the charity and the higher-rate donor?",
    a: "Donor pays net amount. Charity reclaims 20% basic rate from HMRC.\n\nHigher-rate taxpayers: the gross donation extends the basic and higher rate bands, meaning more income is taxed at 20% instead of 40% — a further 20% relief.\n\nNon-taxpayers should NOT use gift aid (they may owe the basic rate deduction to HMRC)."
  },
  {
    id: 13, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "A parent puts money into a building society account for their minor child. Child earns £120 interest. Who pays tax on it?",
    a: "The PARENT pays tax on the full £120 (not just the excess over £100).\n\nThe £100 de minimis: if income from parental gifts exceeds £100, the ENTIRE amount is the parent's income — not just the excess. This is all-or-nothing."
  },
  {
    id: 14, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the high income child benefit charge (HICBC)?",
    a: "Tax charge on individuals with adjusted net income above £60,000 who receive (or whose partner receives) Child Benefit.\n\nCharge: 1% of Child Benefit for every £200 of income over £60,000.\nFull 100% clawback at £80,000.\n\n2025/26 rates: £26.05/week first child, £17.25/week subsequent."
  },
  {
    id: 15, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 3", category: "Tax Rule",
    q: "What is the annual trading allowance?",
    a: "£1,000. Trading income below £1,000 is exempt and need not be declared. If above £1,000, the £1,000 allowance can be claimed instead of deducting actual expenses."
  },

  // ══════════════════════════════════════════════════
  // SECTION 1: EMPLOYEE BENEFITS
  // ══════════════════════════════════════════════════
  {
    id: 16, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Tax Rule",
    q: "A company petrol car has CO₂ emissions of 133 g/km. What is the benefit-in-kind percentage for 2025/26?",
    a: "32%. Emissions are rounded DOWN to the nearest 5 g/km → 130 g/km → 32%.\n\nThe benefit = 32% × list price (including accessories, excluding any employer discount)."
  },
  {
    id: 17, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What determines the taxable car benefit — list price, discounted cost to employer, or market value?",
    a: "LIST PRICE (including accessories, ignoring any employer discount).\n\nIf the employer paid £28,750 but the list price is £31,500, the benefit is calculated on £31,500. Discounts are irrelevant."
  },
  {
    id: 18, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Is a pool car a taxable benefit?",
    a: "No — provided ALL THREE conditions are met:\n1. Available to MORE than one employee\n2. NOT normally kept overnight at any employee's home\n3. Any private use is INCIDENTAL to business use\n\nIf any condition is missed, it becomes fully taxable."
  },
  {
    id: 19, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A company provides a work bus to employees. Is this a taxable benefit?",
    a: "No. The work bus exemption means no income tax arises regardless of the taxpayer's rate of tax."
  },
  {
    id: 20, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the fuel benefit calculation for 2025/26?",
    a: "Fuel benefit = same CO₂ % as the car benefit × £28,200 (the set figure for 2025/26).\n\nMaximum: 37% × £28,200 = £10,434.\n\nNo fuel benefit for purely electric vehicles."
  },
  {
    id: 21, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What NIC applies to most employee benefits in kind?",
    a: "Class 1A — paid by the EMPLOYER ONLY at 15% on the taxable benefit value.\n\nEmployees pay NO NICs on benefits in kind (unless the benefit can easily be converted to cash, which would attract Class 1)."
  },
  {
    id: 22, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What are the key features of a beneficial employee loan for tax?",
    a: "Tax on the DIFFERENCE between: interest at official rate (3.75% for 2025/26) and interest actually paid.\n\nLoans of £10,000 or less in AGGREGATE are exempt.\n\nIf loan is written off, the amount written off is a taxable benefit."
  },
  {
    id: 23, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the mileage rate for business use of an employee's own car for income tax purposes?",
    a: "45p per mile for the first 10,000 business miles; 25p per mile thereafter.\n\nPayments within these rates are tax free. Any excess is taxable. For NIC, flat rate 45p applies to all miles."
  },
  {
    id: 24, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 3", category: "Tax Rule",
    q: "List five employee benefits that are generally EXEMPT from income tax.",
    a: "1. Group income protection premiums paid by employer\n2. Meals in a staff canteen (available to all staff)\n3. ONE mobile phone\n4. Long service awards (20+ years, ≤£50 per year of service)\n5. Trivial benefits (cost ≤£50 per benefit)"
  },

  // ══════════════════════════════════════════════════
  // SECTION 2: NATIONAL INSURANCE CONTRIBUTIONS
  // ══════════════════════════════════════════════════
  {
    id: 25, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 1 employee NIC rates and key thresholds for 2025/26?",
    a: "Lower Earnings Limit (LEL): £125/week — earns benefit entitlement at zero rate\nPrimary Threshold (PT): £242/week\nUpper Earnings Limit (UEL): £967/week\n\nRates: 0% below PT; 8% between PT and UEL; 2% above UEL."
  },
  {
    id: 26, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 1 EMPLOYER NIC rates and thresholds for 2025/26?",
    a: "Secondary Threshold: £96/week (£5,000/year)\nRate: 15% on ALL earnings above £96/week — NO upper limit.\n\nEmployment allowance: £10,500 per business (deducted from employer's total secondary NICs). NOT available where sole employee is a director."
  },
  {
    id: 27, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An employee earns between £125 and £242 per week. Do they pay NICs?",
    a: "No employee NICs are paid. But earnings in this band (LEL to PT) are ZERO-RATED — the employee still builds up entitlement to the State Pension and other contributory benefits.\n\nThis is a critical distinction from below-LEL earnings which confer no benefit entitlement."
  },
  {
    id: 28, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 4 NIC rates and thresholds for self-employed individuals in 2025/26?",
    a: "6% on profits between £12,570 and £50,270\n2% on profits above £50,270\n\nClass 4 NICs do NOT confer any State benefit entitlement — they are purely a tax on profits."
  },
  {
    id: 29, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "When are Class 2 NICs actually paid in 2025/26?",
    a: "Class 2 NICs (£3.50/week) are DEEMED PAID automatically when self-employed profits are at or above £6,845 (the small profits threshold). No actual payment required.\n\nBELOW £6,845: can pay VOLUNTARILY to maintain State Pension entitlement."
  },
  {
    id: 30, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does paying Class 4 NICs give a self-employed person entitlement to contributory State benefits?",
    a: "No. Class 4 NICs generate NO State benefit entitlement whatsoever.\n\nIt is Class 2 NICs (now mostly deemed paid above the small profits threshold) that protect contributory benefit rights such as the State Pension."
  },
  {
    id: 31, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Tax Rule",
    q: "How are NICs calculated for a company director?",
    a: "On an ANNUAL EARNINGS PERIOD basis — not weekly or monthly like employees.\n\nAll earnings since 6 April are cumulated on each payment. The annual primary threshold is £12,570 for 2025/26.\n\nThis prevents directors manipulating the timing of payments to reduce NICs."
  },
  {
    id: 32, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Tax Rule",
    q: "What are Class 1A NICs?",
    a: "Employer-only contributions at 15% on most taxable benefits in kind (e.g. company cars, private medical insurance).\n\nNot paid by the employee. Due by 22 July following the end of the tax year.\n\nClass 1 takes priority over Class 1A (so easily convertible benefits attract Class 1, not 1A)."
  },
  {
    id: 33, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Why is an employee with earnings marginally above the LEL but below the Primary Threshold credited with NICs?",
    a: "Earnings between the LEL (£125/week) and PT (£242/week) are ZERO-RATED — employees in this band are treated as having paid NICs for benefit entitlement purposes (e.g. State Pension) even though no contributions are deducted.\n\nThis protects low earners' rights to State benefits."
  },
  {
    id: 34, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 3", category: "Tax Rule",
    q: "What is the Class 3 NIC rate and purpose?",
    a: "£17.75 per week — voluntary contributions to fill gaps in NI contribution records.\n\nCannot be paid in the year of reaching State Pension age or after. Payments can be made up to 6 years retrospectively."
  },

  // ══════════════════════════════════════════════════
  // SECTION 3: CAPITAL GAINS TAX
  // ══════════════════════════════════════════════════
  {
    id: 35, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the CGT rates for individuals in 2025/26?",
    a: "Basic rate: 18% (gains falling within unused basic rate band)\nHigher rate: 24% (gains above basic rate band)\nBusiness Asset Disposal Relief (BADR): 14% always\nInvestors' Relief: 14% always\n\nGains sit on TOP of income. The remaining basic rate band (£37,700 minus taxable non-savings income) determines how much is taxed at 18%."
  },
  {
    id: 36, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "How does a chargeable event gain from a life assurance policy interact with CGT rates in the same year?",
    a: "The TOP-SLICED gain (not the full gain) is added to income for the purpose of calculating remaining basic rate band for CGT.\n\nThe top-sliced gain PRECEDES the CGT gain in the ordering. This can push more of the CGT gain into the 24% band."
  },
  {
    id: 37, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the CGT annual exempt amount for individuals in 2025/26?",
    a: "£3,000.\n\nCannot be carried forward. Cannot offset income tax.\n\nAllocated against gains in the way that MINIMISES tax (set against gains taxed at the highest rate first)."
  },
  {
    id: 38, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are transfers of assets between spouses/civil partners treated for CGT?",
    a: "No gain, no loss disposal. The recipient spouse takes the asset at the transferor's ORIGINAL BASE COST.\n\nThe full gain crystallises on the recipient's eventual disposal — calculated from the original cost.\n\nUseful for planning: transfer to spouse with unused AEA or lower tax rate."
  },
  {
    id: 39, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "When do no gain/no loss transfers apply to a separating couple?",
    a: "Separating couples have up to THREE YEARS after the end of the tax year in which they cease living together for no gain/no loss transfers.\n\nAssets transferred as part of a FORMAL DIVORCE AGREEMENT have NO time limit.\n\nThe deadline is from end of tax year of separation — not from date of separation."
  },
  {
    id: 40, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "Which assets are exempt from CGT? Name the key ones.",
    a: "Gilt-edged securities (gilts)\nQualifying corporate bonds (QCBs)\nISA/Junior ISA/CTF holdings\nVCT shares (on which income tax relief was given)\nEIS/SEIS shares (IT relief given and not withdrawn)\nPrivate motor cars\nMain private residence (PRR)\nNS&I Savings Certificates and Premium Bonds\nDecorations for valour\nGambling winnings"
  },
  {
    id: 41, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is Business Asset Disposal Relief (BADR)?",
    a: "Reduces CGT to 14% on the first £1 million of qualifying lifetime gains.\n\nAssets must be owned for at least 2 years before disposal.\n\nFor company shares: must hold 5%+ AND be an employee or director for at least 2 years.\n\nNote: Rate increases to 18% from 6 April 2026."
  },
  {
    id: 42, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are capital losses in the same year as gains treated?",
    a: "Losses MUST be set against same-year gains first — EVEN if this wastes the annual exempt amount.\n\nUnused losses carry forward indefinitely and are set against future gains AFTER the AEA is deducted.\n\nOne spouse's losses cannot be set against the other's gains."
  },
  {
    id: 43, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a capital loss arise from disposing of an exempt asset?",
    a: "No. If the asset is EXEMPT from CGT (e.g. gilts, QCBs, VCT shares), no loss can arise either.\n\nThe exemption works both ways — no gains AND no losses."
  },
  {
    id: 44, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the share identification rules for CGT?",
    a: "Disposals matched with acquisitions in this order:\n1. Same day acquisitions\n2. Acquisitions within the FOLLOWING 30 days (prevents bed-and-breakfasting)\n3. The share POOL — all other acquisitions at weighted average cost"
  },
  {
    id: 45, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor sells shares and buys the same shares back the next day. What CGT applies?",
    a: "If repurchased within 30 days, the disposal is MATCHED WITH THE REPURCHASE — not the original pool cost. This eliminates the gain/loss.\n\nThis is the 30-day rule preventing 'bed and breakfasting.' To realise a gain/loss the investor must wait 30 days before repurchasing."
  },
  {
    id: 46, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is holdover relief in CGT?",
    a: "A gift of trading business assets or a gift attracting an immediate IHT charge (e.g. into a discretionary trust) can be 'held over.'\n\nNo CGT at the time of gift. The gain REDUCES the donee's base cost. Both donor and donee must jointly claim (except gifts to trusts — donor claims alone)."
  },
  {
    id: 47, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the CGT annual exempt amount and rate for trustees in 2025/26?",
    a: "Rate: 24% on ALL chargeable assets (residential property also 24%).\nAnnual exempt amount: £1,500 (halved vs. individual).\n\nFurther reduced if same settlor has multiple trusts:\n2 trusts: £750 each | 3 trusts: £500 each | 4 trusts: £375 each | 5+ trusts: £300 each (minimum)"
  },
  {
    id: 48, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "When must CGT on a UK residential property disposal be paid?",
    a: "Within 60 DAYS of completion of the disposal — via an online property report (payment on account).\n\nFinal settlement through self assessment by 31 January following the tax year.\n\nThis 60-day rule applies even to trustees."
  },
  {
    id: 49, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is business rollover relief?",
    a: "When a business sells a qualifying asset (land, fixed plant, goodwill for individuals) and buys replacement qualifying business assets within 1 year before/3 years after disposal, the gain can be ROLLED INTO the new asset's cost. No immediate CGT."
  },
  {
    id: 50, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the private residence relief (PRR) final period exemption?",
    a: "The last 9 MONTHS of ownership are always treated as occupied (exempt), provided the property was the main residence at SOME POINT.\n\nExtends to 36 months for disabled persons and those in long-term care."
  },
  {
    id: 51, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the chattel CGT exemption?",
    a: "Chattels (tangible movable property) with disposal proceeds of £6,000 or less: FULLY EXEMPT.\n\nIf proceeds exceed £6,000: gain cannot exceed 5/3 × (proceeds − £6,000).\n\nExample: ring sold for £7,800 — max gain = 5/3 × £1,800 = £3,000."
  },
  {
    id: 52, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Can 'clogged losses' from a connected person disposal be used against other gains?",
    a: "No. Losses on transactions with CONNECTED PERSONS can only be set against gains from the SAME connected person.\n\nThey cannot be used against other capital gains. This prevents artificial loss creation between connected parties."
  },

  // ══════════════════════════════════════════════════
  // SECTION 4: INHERITANCE TAX
  // ══════════════════════════════════════════════════
  {
    id: 53, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the IHT nil rate band (NRB) for 2025/26?",
    a: "£325,000. Frozen until 5 April 2030.\n\nIHT at death: 40% on excess above NRB.\nLifetime CLT rate: 20% on excess above NRB.\nReduced rate of 36% if 10%+ of net estate left to UK charity."
  },
  {
    id: 54, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Residence Nil Rate Band (RNRB) for 2025/26?",
    a: "£175,000. Frozen until 5 April 2030.\n\nAvailable only where a qualifying residence passes to DIRECT DESCENDANTS on death.\n\nTapered at £1 per £2 of net estate above £2m. Unused RNRB can be transferred to surviving spouse."
  },
  {
    id: 55, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a Potentially Exempt Transfer (PET)?",
    a: "A lifetime gift by an individual to:\n(a) Another individual\n(b) A bare/absolute trust\n(c) A disabled trust\n\nNo IHT at date of gift. No need to report to HMRC.\nSurvive 7 years → fully exempt.\nDie within 7 years → becomes chargeable at death rates (subject to taper relief if 3+ years)."
  },
  {
    id: 56, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Principle",
    q: "Why must PETs be tracked even though they generate no IHT at the time of the gift?",
    a: "A failed PET USES UP THE NRB — it erodes the nil rate band available for the death estate.\n\nEven if a PET within the NRB generates no IHT on itself, it reduces the NRB available for subsequent CLTs and the death estate — potentially costing substantial tax."
  },
  {
    id: 57, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a Chargeable Lifetime Transfer (CLT)?",
    a: "A lifetime transfer that is NEITHER exempt NOR a PET — most commonly a gift into a discretionary trust (or most other trusts created on/after 22 March 2006).\n\nTax: 20% on excess over cumulative NRB at date of transfer.\nIf donor dies within 7 years: recalculated at 40% with taper relief; lifetime tax paid as credit."
  },
  {
    id: 58, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is taper relief for IHT and how does it work?",
    a: "Reduces IHT payable on PETs/CLTs where donor survives 3–7 years:\n3–4 years: 80% of full tax\n4–5 years: 60% of full tax\n5–6 years: 40% of full tax\n6–7 years: 20% of full tax\n7+ years: nil (fully exempt)\n\nTaper reduces the TAX — not the value of the transfer in cumulation."
  },
  {
    id: 59, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does taper relief reduce the value of a gift counted in the 7-year cumulation?",
    a: "NO. Taper relief only reduces the IHT PAYABLE on that specific transfer.\n\nThe FULL VALUE of the gift still counts in cumulation and erodes the nil rate band for future transfers. Many candidates confuse this."
  },
  {
    id: 60, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the IHT cumulation principle?",
    a: "All chargeable transfers (CLTs + failed PETs) in the 7 years BEFORE any new transfer are added together.\n\nThe NRB is set against the cumulative total — only the EXCESS is taxed.\n\nA transfer drops out of cumulation once more than 7 years old."
  },
  {
    id: 61, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "List the main IHT lifetime exemptions.",
    a: "Spouse/civil partner: Unlimited (long-term UK resident)\nAnnual exemption: £3,000 per donor per tax year (unused portion carries forward 1 year only — current year used first)\nSmall gifts: £250 per donee per year (cannot top up other exemptions)\nNormal expenditure from income: Unlimited (habitual, from income, no reduction in standard of living)\nWedding/civil partnership gifts: £5,000 parent | £2,500 grandparent | £1,000 other\nCharity gifts: Unlimited"
  },
  {
    id: 62, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can the £3,000 annual IHT exemption and the £250 small gifts exemption be combined for a single gift?",
    a: "No. The small gifts exemption cannot 'top up' a gift already partially covered by the annual exemption.\n\nIf the annual exemption is used for part of a gift, the £250 exemption cannot cover the excess."
  },
  {
    id: 63, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "How many years can unused IHT annual exemption be carried forward?",
    a: "ONE year only.\n\nUnused portion from year 1 can be carried to year 2 giving £4,500 maximum — but ONLY if the current year's £3,000 is used first.\n\nAny remaining unused amount is PERMANENTLY LOST after 1 year."
  },
  {
    id: 64, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the three conditions for the 'normal expenditure from income' IHT exemption?",
    a: "1. Habitual/regular — part of the transferor's normal pattern of expenditure\n2. Made from INCOME (not capital)\n3. After the payment, the transferor has sufficient income to maintain their usual STANDARD OF LIVING\n\nNo maximum amount — ideal for regular life policy premium payments."
  },
  {
    id: 65, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is the unused NRB of a deceased spouse transferred?",
    a: "The proportion of NRB UNUSED on first death transfers to the surviving spouse as a percentage.\n\nOn second death: that percentage × NRB in force at SECOND DEATH.\n\nMaximum increase: 100% (doubling the NRB). Upper limit prevents exceeding double NRB."
  },
  {
    id: 66, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a gift with reservation (GWR) for IHT?",
    a: "A gift where the donor CONTINUES TO ENJOY A BENEFIT from the property.\n\nResult: property remains in the donor's estate for IHT at its DEATH VALUE — potential double charge.\n\nExample: giving a house to a child but continuing to live there rent-free."
  },
  {
    id: 67, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "If a parent gifts a house to a child but pays full market rent, is it a gift with reservation?",
    a: "No. Payment of FULL MARKET RENT from the outset prevents GWR — the gift is an outright PET.\n\nIf the rent later drops below market rate, GWR begins from THAT DATE. The property then enters the donor's estate."
  },
  {
    id: 68, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is business relief (BR) for IHT and the rates?",
    a: "100% BR: unincorporated businesses; shareholdings of ANY SIZE in unquoted/AIM companies.\n50% BR: controlling shareholdings in fully listed companies; land/buildings/plant used in owner's business.\n\nMust be owned for at least 2 years.\n\nImportant: from 6 April 2026, £1m lifetime cap on 100% BR; AIM shares drop to 50%."
  },
  {
    id: 69, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the IHT rules for a discretionary trust — entry, periodic, and exit charges?",
    a: "Entry (CLT): 20% on excess over available NRB at time of transfer.\n\nPeriodic (10-year anniversary): max 6% of trust value (30% × 20% × value above NRB at that time).\n\nExit: proportional to last periodic rate × quarters held since last ten-year anniversary ÷ 40."
  },
  {
    id: 70, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "When is IHT on the death estate due?",
    a: "6 months after the END OF THE MONTH of death (not 6 months from the date of death).\n\nPayable by the LEGAL PERSONAL REPRESENTATIVES (LPRs).\n\nInterest accrues from the due date on any unpaid tax."
  },
  {
    id: 71, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Does the RNRB apply to lifetime transfers becoming chargeable on death?",
    a: "No. The RNRB is ONLY available against the death estate.\n\nIt CANNOT be set against PETs or CLTs even when they become chargeable as a result of death."
  },
  {
    id: 72, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is quick succession relief (QSR)?",
    a: "Where IHT was paid on a transfer and the beneficiary dies within 5 years, a percentage of that IHT is credited against the second death's tax:\n0–1 year: 100% | 1–2 years: 80% | 2–3 years: 60% | 3–4 years: 40% | 4–5 years: 20%"
  },
  {
    id: 73, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is Pre-Owned Assets Tax (POAT)?",
    a: "An INCOME TAX charge on the annual benefit enjoyed from assets the taxpayer has previously gifted (since 18 March 1986) and continues to benefit from.\n\nNo charge if the annual benefit ≤ £5,000.\nDoes NOT apply if the asset is already caught by GWR."
  },
  {
    id: 74, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "In what order must IHT calculations be performed when someone dies having made both PETs and CLTs?",
    a: "Go back to the EARLIEST transfer within 7 years of death. For each transfer calculate the 7-year cumulation at the DATE OF THAT TRANSFER (CLTs and failed PETs within 7 years of that gift). Apply NRB and taper relief. Finally calculate IHT on the death estate using remaining NRB."
  },

  // ══════════════════════════════════════════════════
  // SECTION 5: RESIDENCE
  // ══════════════════════════════════════════════════
  {
    id: 75, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the automatic UK residence tests for 2025/26?",
    a: "Automatically UK RESIDENT if:\n(a) 183+ days in UK in the tax year, OR\n(b) UK home held for 91+ consecutive days (30 in the tax year) with no overseas home used 30+ days, OR\n(c) Full-time work in UK for 365 days."
  },
  {
    id: 76, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the automatic non-UK residence tests?",
    a: "Automatically NOT UK resident if:\n(a) Fewer than 16 days in UK, OR\n(b) Not previously resident for 3 years AND fewer than 46 days in UK, OR\n(c) Full-time overseas work (35+ hours/week average) with fewer than 91 days and fewer than 31 working days in UK."
  },
  {
    id: 77, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the 5 UK ties for the Sufficient UK Ties test?",
    a: "1. Family tie: UK-resident spouse/partner/minor children\n2. Accommodation tie: accessible UK accommodation used during the year\n3. Work tie: 40+ days' substantive work in UK\n4. 90-day tie: 90+ days in UK in either of the 2 previous years\n5. Country tie: more days in UK than any other country (only for LEAVERS, not arrivals)"
  },
  {
    id: 78, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the FIG regime?",
    a: "Foreign Income and Gains regime. A qualifying new resident (not UK resident for 10 consecutive years before arrival) can claim 100% relief from UK tax on foreign income and gains for the FIRST 4 TAX YEARS of UK residence.\n\nClaiming loses the personal allowance AND CGT annual exempt amount for that year."
  },
  {
    id: 79, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 2", category: "Tax Rule",
    q: "For IHT purposes, what does 'long-term resident' mean?",
    a: "Being UK tax resident for at least 10 out of the previous 20 tax years.\n\nLong-term residents: liable to IHT on WORLDWIDE assets.\nNon-long-term residents: IHT only on UK-situated assets."
  },

  // ══════════════════════════════════════════════════
  // SECTION 6: TAX COMPLIANCE & SELF ASSESSMENT
  // ══════════════════════════════════════════════════
  {
    id: 80, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Process",
    q: "What are the key self assessment dates for the 2025/26 tax year?",
    a: "31 January 2026: 1st payment on account (50% of 2024/25 SA liability)\n31 July 2026: 2nd payment on account\n31 October 2026: Paper return deadline\n31 January 2027: Online return + balancing payment due\n\nCGT (not residential property) and voluntary Class 2 NICs are included in the balancing payment only."
  },
  {
    id: 81, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are payments on account and when are they NOT required?",
    a: "Two payments of 50% each of the PREVIOUS YEAR'S SA liability (income tax + Class 4 NICs, but NOT CGT or Class 2 NICs).\n\nNOT required if:\n- SA liability below £1,000, OR\n- 80%+ of previous year's liability was collected via PAYE/at source"
  },
  {
    id: 82, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Ramsay principle?",
    a: "A judicial anti-avoidance doctrine looking at the OVERALL RESULT of a series of pre-arranged transactions rather than each step individually.\n\nIf steps have no commercial purpose other than tax avoidance, HMRC can ignore them and tax the net economic result."
  },
  {
    id: 83, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the General Anti-Abuse Rule (GAAR)?",
    a: "Applies to tax arrangements that are ABUSIVE (cannot reasonably be regarded as a reasonable course of action).\n\nApplies to all main taxes EXCEPT VAT.\nPenalty: up to 60% of counteracted tax.\nIndependent GAAR advisory panel provides opinions."
  },
  {
    id: 84, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Comparison",
    q: "Distinguish between tax evasion, tax avoidance, and tax mitigation.",
    a: "EVASION: Illegal. Deliberately not declaring taxable income/gains. Criminal offence. Penalties + possible imprisonment.\n\nAVOIDANCE: Legal arrangements to reduce tax — but increasingly challenged by GAAR and Ramsay.\n\nMITIGATION: Straightforward use of available reliefs, exemptions, allowances — fully legitimate."
  },
  {
    id: 85, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 2", category: "Process",
    q: "What is DOTAS?",
    a: "Disclosure Of Tax Avoidance Schemes. Promoters must REGISTER avoidance schemes with HMRC. Each registered scheme receives a number. Users must quote the number on their tax return.\n\nRegistration does NOT mean HMRC approves the scheme."
  },

  // ══════════════════════════════════════════════════
  // SECTION 7: STAMP DUTIES
  // ══════════════════════════════════════════════════
  {
    id: 86, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What SDLT applies to a £400,000 residential property purchase (non-first-time buyer, only property)?",
    a: "£0–£125,000: 0% = £0\n£125,001–£250,000: 2% = £2,500\n£250,001–£400,000: 5% = £7,500\nTotal SDLT: £10,000\n\nSDLT is calculated on SLICES — different rates apply to different portions."
  },
  {
    id: 87, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is first-time buyer SDLT relief?",
    a: "Up to £300,000: 0%.\n£300,001–£500,000: 5% on excess over £300,000.\nAbove £500,000: FULL normal rates apply — relief lost entirely.\n\nAll buyers must be first-time buyers (never owned residential property anywhere in the world)."
  },
  {
    id: 88, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the SDLT surcharge for additional residential properties?",
    a: "5% surcharge added to each SDLT band on residential purchases where buyer will own 2+ properties AND is NOT replacing their main residence.\n\nApplies on properties costing £40,000+."
  },
  {
    id: 89, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is Stamp Duty Reserve Tax (SDRT) and what rate applies?",
    a: "0.5% on PAPERLESS (electronic) share transactions via CREST.\n\nCharged on the agreement to transfer shares — the broker pays SDRT; it appears on the contract note.\n\nStamp duty (on paper transfers) is also 0.5% — rounded UP to the nearest £5."
  },
  {
    id: 90, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What stamp duty applies to purchases of AIM-listed company shares?",
    a: "NEITHER stamp duty NOR SDRT. Transactions in AIM shares (and AQSE Growth Market) are EXEMPT.\n\nThis also applies to UK-based exchange-traded funds (ETFs).\n\nGilts are also exempt from both stamp duty and SDRT."
  },
  {
    id: 91, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor buys shares using a stock transfer FORM (paper). What applies — stamp duty or SDRT?",
    a: "STAMP DUTY (on the paper document/stock transfer form) at 0.5%, rounded up to nearest £5.\n\nSDRT applies to PAPERLESS/electronic transfers. Both rates are 0.5% but different rules apply."
  },

  // ══════════════════════════════════════════════════
  // SECTION 8: VAT AND CORPORATION TAX
  // ══════════════════════════════════════════════════
  {
    id: 92, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the VAT registration and deregistration thresholds for 2025/26?",
    a: "Registration threshold: £90,000 (rolling 12-month period). Must notify within 30 days; effective 1st of following month.\n\nDeregistration threshold: £88,000."
  },
  {
    id: 93, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the corporation tax rates for 2025/26?",
    a: "Profits ≤ £50,000: 19% (small profits rate)\nProfits ≥ £250,000: 25% (main rate)\nBetween £50,000–£250,000: marginal relief applies (effective rate up to 26.5% in that band)\n\nThresholds divided by number of ASSOCIATED companies."
  },
  {
    id: 94, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "When must most companies pay corporation tax?",
    a: "9 months and 1 DAY after the end of the accounting period.\n\nExample: year end 30 June 2025 → tax due 1 April 2026.\n\nLARGE companies (profits ≥ £1.5m) pay by quarterly instalments."
  },
  {
    id: 95, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "What is the key distinction between zero-rated and exempt VAT supplies?",
    a: "ZERO-RATED: Taxable at 0% — business CAN reclaim input VAT on related purchases.\n\nEXEMPT: NOT taxable — business CANNOT reclaim related input VAT.\n\nThis is crucial: zero-rating is better for the supplier as it preserves input VAT recovery."
  },

  // ══════════════════════════════════════════════════
  // SECTION 9: DIRECT INVESTMENTS
  // ══════════════════════════════════════════════════
  {
    id: 96, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are dividends from UK shares taxed for an individual in 2025/26?",
    a: "First £500: dividend allowance at 0%.\nAbove £500: 8.75% (basic), 33.75% (higher), 39.35% (additional).\n\nDividends are paid GROSS and sit on TOP of non-savings and savings income in the ordering."
  },
  {
    id: 97, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are gilts taxed for an individual?",
    a: "Interest: taxed as savings income (paid gross).\nCapital gains: EXEMPT from CGT.\nCapital losses: NOT allowable.\n\nGilts are classified as qualifying corporate bonds for CGT purposes."
  },
  {
    id: 98, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor holds FTSE 100 shares, gilts, and equity unit trusts. Which can produce an allowable CGT loss?",
    a: "Only FTSE 100 shares and equity unit trusts.\n\nGilts are EXEMPT assets — no allowable loss arises. The exemption eliminates both gains AND losses."
  },
  {
    id: 99, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How does the mortgage interest restriction work for residential property landlords?",
    a: "Finance costs (mortgage interest etc.) on RESIDENTIAL property are NOT deducted from property income.\n\nInstead: a 20% tax CREDIT applied against income tax liability.\n\nHigher/additional rate taxpayers therefore do NOT get full relief — only a 20% credit, not 40%/45%."
  },
  {
    id: 100, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is rent a room relief?",
    a: "If gross receipts from letting a room in the taxpayer's ONLY or MAIN RESIDENCE do not exceed £7,500 → income is EXEMPT.\n\nIf above £7,500: choose (a) normal basis (income minus expenses) or (b) excess over £7,500 with NO expenses.\n\nSplit to £3,750 each if jointly let."
  },
  {
    id: 101, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 2", category: "Tax Rule",
    q: "How are interest distributions from fixed-interest unit trusts taxed?",
    a: "As SAVINGS INCOME (NOT dividends) — paid gross.\n\nRates: 20% basic, 40% higher, 45% additional.\nPSA and starting rate band can be used against them.\n\nContrast with equity unit trusts whose distributions are taxed as dividends."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: INDIRECT INVESTMENTS — ISAs
  // ══════════════════════════════════════════════════
  {
    id: 102, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the ISA annual subscription limit for 2025/26?",
    a: "£20,000 across ALL adult ISAs combined (cash, stocks and shares, Lifetime, innovative finance).\nJunior ISA: £9,000.\nLifetime ISA: £4,000 per year (counts within the £20,000 total).\n\nAll limits frozen until 5 April 2030."
  },
  {
    id: 103, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the tax treatment inside an ISA?",
    a: "All income and capital gains are COMPLETELY FREE of tax and need not be declared on a tax return.\n\nAll ISA encashments are free of income tax and CGT.\n\nNO foreign withholding tax can be reclaimed (fund manager reclaims on behalf)."
  },
  {
    id: 104, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a 16-year-old open an adult cash ISA?",
    a: "No. Minimum age for ALL adult ISAs is now 18.\n\nAt 16, only a Junior ISA is available (for those born on/after 3 January 2011 without a CTF)."
  },
  {
    id: 105, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does income from a Junior ISA count as the PARENT's income?",
    a: "No. Income from Junior ISAs and CTFs is SPECIFICALLY EXEMPT from the parental settlement rule.\n\nIncome belongs to the child regardless of whether capital came from a parent."
  },
  {
    id: 106, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the rules for a Lifetime ISA?",
    a: "Available to those aged 18–39.\nAnnual limit: £4,000 (within the £20,000 overall ISA limit).\n25% Government bonus (max £1,000/year) paid until age 50.\nUse for first home purchase (cap £450,000) or retirement from age 60.\nWithdrawal for any other purpose: 25% penalty (effectively losing bonus + some capital)."
  },
  {
    id: 107, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "Can a CTF be transferred to a Junior ISA?",
    a: "Yes. A CTF can be transferred into a Junior ISA. Once transferred, contributions go into the Junior ISA only.\n\nA CTF and Junior ISA CANNOT both have active contributions simultaneously — CTF must be transferred first."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: INDIRECT INVESTMENTS — LIFE ASSURANCE
  // ══════════════════════════════════════════════════
  {
    id: 108, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the 5% withdrawal rule for an onshore life assurance bond?",
    a: "5% of the original premium can be withdrawn per policy year without triggering a chargeable event.\n\nAllowance ACCUMULATES — unused 5% carries forward (e.g. year 3 allows 15% if nothing taken in years 1 & 2).\n\nMaximum cumulative tax-deferred withdrawal: 100% (20 years)."
  },
  {
    id: 109, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Are withdrawals under the 5% rule from a life assurance bond 'tax free'?",
    a: "No — they are TAX DEFERRED, not tax exempt.\n\nThe deferred gain will crystallise at full surrender. The 5% rule simply delays the tax — it does not eliminate it."
  },
  {
    id: 110, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the main chargeable events for a non-qualifying life policy?",
    a: "Death (paying benefit)\nMaturity\nFull surrender\nCertain part surrenders (exceeding cumulative 5% allowance at end of policy year)\nPolicy loans\nAssignment for money or money's worth"
  },
  {
    id: 111, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is a chargeable event gain from an ONSHORE bond taxed?",
    a: "Treated as savings income (highest slice). Added to income.\n\nA 20% BASIC RATE CREDIT is given (life fund has paid tax at 20%).\n\nNet additional tax:\n- Higher-rate taxpayer: 40% − 20% = 20%\n- Additional-rate taxpayer: 45% − 20% = 25%\n- Basic-rate taxpayer: 0% (if gain keeps them basic-rate)"
  },
  {
    id: 112, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Principle",
    q: "What is the PURPOSE of top-slicing relief for life assurance bonds?",
    a: "To prevent a large gain pushing the taxpayer into a higher rate band simply because the gain has accumulated over many years.\n\nThe gain is divided by N (number of complete policy years) to find the 'annual equivalent,' which is used to determine the RATE of tax — then that rate is applied to the FULL gain."
  },
  {
    id: 113, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Calculation",
    q: "What are the 5 steps to calculate top-slicing relief?",
    a: "Step 1: Calculate tax on FULL gain (with other income). Deduct 20% basic rate credit → Step 2 liability.\nStep 2: Annual equivalent = gain ÷ N complete years.\nStep 3: Calculate tax on annual equivalent. Deduct 20% credit. Multiply result × N → 'Relieved liability.'\nStep 4: Top-slicing relief = Step 2 liability − Relieved liability.\nStep 5: Tax payable = Total year's tax − top-slicing relief."
  },
  {
    id: 114, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A basic-rate taxpayer surrenders an onshore bond with a gain. When does additional income tax arise?",
    a: "ONLY if the gain, when added to other income, pushes income into the HIGHER rate band.\n\nIf they remain a basic-rate taxpayer throughout (including with the gain), NO additional tax is due — the 20% has already been paid by the life company."
  },
  {
    id: 115, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Where does a life assurance chargeable event gain sit in the income ordering?",
    a: "LAST — it is always treated as the HIGHEST PART of income, above savings income and dividends.\n\nThis can push other income into higher bands and reduce the personal savings allowance available."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: OFFSHORE BONDS
  // ══════════════════════════════════════════════════
  {
    id: 116, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Comparison",
    q: "What is the KEY tax difference between onshore and offshore bonds?",
    a: "ONSHORE: 20% basic rate treated as paid (life fund has paid tax). Net tax: higher-rate = 20%; additional-rate = 25%.\n\nOFFSHORE: No basic rate credit (gross roll-up). Full rates apply: basic = 20%; higher = 40%; additional = 45%."
  },
  {
    id: 117, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Why might an additional-rate taxpayer still choose an ONSHORE bond over an offshore bond?",
    a: "Onshore: 20% in fund + 25% on gain = 40% effective rate on the gross return.\nOffshore: 45% on the gross gain.\n\nThe onshore bond gives a LOWER effective tax rate at surrender, despite the fund-level tax.\n\nHowever, the offshore bond's GROSS ROLL-UP can outperform long-term due to compounding."
  },
  {
    id: 118, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is time apportionment relief for an offshore bond?",
    a: "Where the policyholder was non-UK resident during part of the policy, the gain is reduced by:\n\n(Days NOT resident ÷ Total days policy held) × gain\n\nIf resident outside UK for entire term: gain = nil."
  },
  {
    id: 119, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "When is a chargeable event gain on a bond held in trust taxed on the settlor vs the trustees?",
    a: "Chargeable on SETTLOR: if alive and UK tax resident at time of chargeable event.\n\nChargeable on TRUSTEES (at 45%): if settlor is dead or non-UK resident.\n\nChargeable on BENEFICIARIES: if trustees are non-UK resident, UK-resident beneficiaries are taxed as they receive benefits."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: EIS, SEIS, VCT
  // ══════════════════════════════════════════════════
  {
    id: 120, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for an EIS investment?",
    a: "Income tax relief: 30% (max £1m; £2m for knowledge-intensive companies)\nCGT exemption: gains exempt if held 3+ years and IT relief not withdrawn\nCGT deferral: any gain reinvested within 1yr before/3yrs after can be deferred — no upper limit\nIHT: 100% business relief after 2 years\nLoss relief: allowable after netting off IT relief received"
  },
  {
    id: 121, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for a SEIS investment?",
    a: "Income tax relief: 50% (max £200,000 per year)\nCGT: 50% EXEMPTION on gains reinvested in SEIS in same or following year (carried back)\nLoss relief: available (net of IT relief)\n\nKey difference from EIS: no CGT deferral — gain is partly exempt (50%), not deferred."
  },
  {
    id: 122, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for a VCT investment?",
    a: "Income tax relief: 30% (max £200,000 in newly issued shares; withdrawn if sold within 5 years)\nDividends: tax FREE (up to £200,000 invested per year)\nCGT: gains EXEMPT (no minimum holding period)\nCGT deferral: NOT available\nIHT: VCT shares do NOT qualify for business relief"
  },
  {
    id: 123, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a VCT investor defer a capital gain by reinvesting in VCT shares?",
    a: "No. CGT DEFERRAL relief is NOT available for VCTs.\n\nDeferral is available for EIS only. VCTs offer CGT EXEMPTION on gains from VCT shares themselves — but cannot shelter gains from other assets."
  },
  {
    id: 124, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Comparison",
    q: "Compare income tax relief rates: EIS vs SEIS vs VCT.",
    a: "EIS: 30% relief — max investment £1m (£2m knowledge-intensive)\nSEIS: 50% relief — max investment £200,000\nVCT: 30% relief — max investment £200,000 (newly issued shares only)\n\nSEIS has the highest relief rate (50%). EIS has the largest maximum investment."
  },
  {
    id: 125, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Do VCT shares qualify for IHT business relief?",
    a: "No. VCT shares are NOT qualifying business property for IHT purposes.\n\nContrast: EIS and SEIS shares DO qualify for 100% business relief after 2 years of ownership."
  },
  {
    id: 126, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "If an EIS investor holds shares for 3+ years and the company qualifies throughout, is the gain always CGT-exempt?",
    a: "Only if INCOME TAX RELIEF was given and NOT subsequently withdrawn.\n\nIf income tax relief has been clawed back, the CGT exemption is also lost."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: REITs
  // ══════════════════════════════════════════════════
  {
    id: 127, section: "Section 10", deck: "REITs and Property Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are REIT distributions taxed for individual investors?",
    a: "Two types:\n1. Property income distribution (PID) from tax-exempt element: treated as property income; paid net of 20% tax. Additional tax for higher/additional rate taxpayers.\n\n2. Non-PID dividend from non-exempt element: taxed as ordinary dividend (8.75%/33.75%/39.35%) with £500 dividend allowance.\n\nCGT on gains from REIT share disposals — ordinary share rules."
  },
  {
    id: 128, section: "Section 10", deck: "REITs and Property Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What structure must a REIT have?",
    a: "UK-resident, CLOSED-ENDED company listed on a recognised stock exchange.\nMust distribute 90%+ of rental profits within 12 months.\n75%+ of gross profits from property letting.\nInterest coverage ratio 125%+."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: PENSIONS
  // ══════════════════════════════════════════════════
  {
    id: 129, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the pension annual allowance for 2025/26?",
    a: "£60,000 (combined employer + employee contributions).\n\nTapered to minimum £10,000 for those with 'adjusted income' (including employer contributions) exceeding £260,000 — at rate of £1 per £2 over £260,000.\n\nUnused allowance carries forward up to 3 years."
  },
  {
    id: 130, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is an Uncrystallised Fund Pension Lump Sum (UFPLS)?",
    a: "A withdrawal from an uncrystallised pension fund where:\n25% of EACH withdrawal is paid TAX FREE\n75% is taxable as income in the year of withdrawal\n\nTriggers the MPAA (£10,000) after the first UFPLS."
  },
  {
    id: 131, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the maximum pension commencement lump sum (PCLS)?",
    a: "25% of the pension fund being crystallised, subject to the LUMP SUM ALLOWANCE of £268,275.\n\nTaking a PCLS alone does NOT trigger the MPAA (unlike drawdown or UFPLS)."
  },
  {
    id: 132, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Money Purchase Annual Allowance (MPAA)?",
    a: "£10,000. Applies once a pension fund is accessed FLEXIBLY (drawdown, UFPLS).\n\nLimits future defined contribution pension contributions.\n\nTaking ONLY a PCLS does NOT trigger the MPAA."
  },
  {
    id: 133, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Is pension income subject to National Insurance Contributions?",
    a: "No. Pension income is subject to INCOME TAX (via PAYE) but NOT to any class of NICs.\n\nThis is a straightforward but commonly confused point."
  },
  {
    id: 134, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are pension death benefits taxed based on the member's age at death?",
    a: "Under 75: lump sums within LSDBA (£1,073,100) are TAX FREE. Annuity/drawdown also tax free. Excess lump sums: taxable as recipient's income.\n\nAt 75 or over: ALL death benefits (whether annuity, drawdown or lump sum) are taxable as INCOME in the hands of the recipient."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: PURCHASED LIFE ANNUITIES
  // ══════════════════════════════════════════════════
  {
    id: 135, section: "Section 10", deck: "Annuities",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is a purchased life annuity (PLA) taxed?",
    a: "Split into:\n(a) Capital element — treated as return of original capital; NOT taxable\n(b) Interest element — taxable as SAVINGS INCOME; tax deducted at source at 20%\n\nCapital element fixed at outset based on purchase price and HMRC mortality tables."
  },
  {
    id: 136, section: "Section 10", deck: "Annuities",
    tier: "Tier 1", category: "Comparison",
    q: "How does the taxation of a purchased life annuity differ from a pension annuity?",
    a: "PLA: Partly tax free (capital return) + interest element taxed as savings income at 0/20/40/45%.\n\nPENSION ANNUITY: FULLY taxable as earned income via PAYE at marginal rate. No tax-free element (tax-free cash was separate at crystallisation)."
  },

  // ══════════════════════════════════════════════════
  // SECTION 11: TRUST INCOME TAX
  // ══════════════════════════════════════════════════
  {
    id: 137, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates for a UK discretionary (relevant property) trust?",
    a: "Dividends: 39.35%\nAll other income (interest, rent): 45%\n\nTrustees do NOT get: personal savings allowance, dividend allowance, or personal allowance.\n\nSpecial allowance: income below £500 may be exempt (but split if multiple trusts by same settlor)."
  },
  {
    id: 138, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates for an interest in possession (IIP) trust?",
    a: "Dividends: 8.75%\nAll other income: 20%\n\nTrustees do NOT get personal savings allowance or dividend allowance.\n\nBeneficiary includes the trust income in their own return and claims a credit for trustee's tax. Higher/additional rate taxpayers pay the difference."
  },
  {
    id: 139, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A discretionary trust receives dividend income. Can the trustees use the £500 dividend allowance?",
    a: "No. Trustees of discretionary trusts are NOT entitled to the dividend allowance.\n\nAll dividend income is taxed at 39.35%. The £500 income exemption is a SEPARATE concept — it only applies where total trust income is below £500."
  },
  {
    id: 140, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "When a discretionary trust distributes income to a beneficiary, what tax credit is attached?",
    a: "ALL distributions carry a 45% TAX CREDIT regardless of the type of income that was originally received.\n\nIf trustees paid only 39.35% on dividends, they must pay the DIFFERENCE to HMRC before distributing.\n\nBasic-rate beneficiaries can reclaim the excess (45% − 20% = 25% repayable)."
  },

  // ══════════════════════════════════════════════════
  // SECTION 12: TAX PLANNING & COMPUTATIONS
  // ══════════════════════════════════════════════════
  {
    id: 141, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Process",
    q: "In what order must the income tax computation steps be performed?",
    a: "Step 1: Total income (add all sources)\nStep 2: Deduct reliefs from income (e.g. loss relief, qualifying interest)\nStep 3: Deduct personal allowance → amount on which tax is calculated\nStep 4: Extend bands for pension (net) and gift aid (gross)\nStep 5: Calculate tax — non-savings → savings → dividends → life assurance gains\nStep 6: Deduct tax reducers (marriage allowance, married couple's allowance)"
  },
  {
    id: 142, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "In what order do a life assurance bond gain and a CGT disposal sit in the income calculation?",
    a: "The TOP-SLICED bond gain is used when calculating the BASIC RATE BAND remaining for CGT purposes.\n\nOrdering: income → top-sliced bond gain (to fix CGT rates) → full bond gain → CGT disposal\n\nSo the top-sliced gain precedes the full CGT gain in rate determination."
  },
  {
    id: 143, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Sophie transfers shares to her husband Stanley for immediate disposal. When and on whom does CGT arise?",
    a: "CGT arises on STANLEY'S DISPOSAL — not on the transfer to Stanley (which is no gain/no loss).\n\nTax is assessed at STANLEY'S rates, on the gain calculated from SOPHIE'S original base cost.\n\nStanley uses HIS OWN annual exempt amount and unused basic rate band."
  },
  {
    id: 144, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Comparison",
    q: "For a higher-rate taxpayer, which is more tax efficient — a reporting offshore fund or a non-reporting offshore fund?",
    a: "REPORTING FUND: gains taxed at 18%/24% CGT rates. Generally more efficient.\n\nNON-REPORTING FUND: the entire gain (income + capital) is taxed as INCOME at 40%/45%.\n\nFor higher-rate taxpayers, reporting funds are generally more tax efficient due to lower CGT rates."
  },
  {
    id: 145, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Process",
    q: "What options does a client with a personal pension aged 62 have to access funds for the first time?",
    a: "1. CRYSTALLISE — take 25% PCLS tax free + flexi-access drawdown (taxable income)\n2. UFPLS — each withdrawal 25% tax free/75% taxable; triggers MPAA after first payment\n3. CRYSTALLISE then purchase annuity (fully taxable as income)\n\nKey considerations: tax rate, income needs, death benefits, MPAA triggering."
  },

  // ══════════════════════════════════════════════════
  // R03 EXAM TRAPS DECK (standalone)
  // ══════════════════════════════════════════════════
  {
    id: 146, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Is the Personal Savings Allowance available to additional-rate taxpayers?",
    a: "No. The PSA is NIL for additional-rate taxpayers.\n\nOnly basic-rate taxpayers get £1,000 and higher-rate taxpayers get £500.\n\nMany candidates incorrectly apply the PSA to all taxpayers."
  },
  {
    id: 147, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can the CGT annual exempt amount be carried forward if unused?",
    a: "No. The £3,000 AEA is PERMANENTLY LOST if not used in the tax year.\n\nOnly capital LOSSES carry forward. The annual exempt amount does not."
  },
  {
    id: 148, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does IHT taper relief reduce the size of the gift in the 7-year cumulation?",
    a: "No. Taper relief reduces the TAX PAYABLE on the gift — NOT the value used in cumulation.\n\nThe FULL GIFT VALUE still erodes the nil rate band for future transfers and the death estate."
  },
  {
    id: 149, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can the IHT RNRB be set against a PET or CLT?",
    a: "No. The RNRB applies ONLY against the death estate.\n\nIt cannot be used against lifetime transfers, even if they become chargeable on death."
  },
  {
    id: 150, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can losses from a disposal to a connected person be set against other gains?",
    a: "No. These 'clogged losses' can ONLY be set against gains from the SAME connected person.\n\nThey cannot offset other capital gains — unlike ordinary losses."
  },
  {
    id: 151, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A person has income of £102,000. What is the effective tax rate on the MARGINAL £1 earned?",
    a: "60%. Between £100,000–£125,140, the personal allowance is withdrawn at £1 per £2 of income.\n\nSo earning an extra £2 costs: £0.80 higher rate tax + £0.40 tax on lost allowance = £1.20 → 60% effective rate."
  },
  {
    id: 152, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: The 5% withdrawal rule applies to onshore bonds only. True or false?",
    a: "FALSE. The 5% tax-deferred withdrawal rule applies to BOTH onshore AND offshore bonds.\n\nThe difference is the tax treatment at the chargeable event: onshore gets a 20% credit; offshore does not."
  },
  {
    id: 153, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A self-employed person's profits are £30,000. Do they pay Class 2 NICs?",
    a: "No actual payment. Class 2 NICs are DEEMED PAID automatically when profits are at or above £6,845.\n\nNo cash payment required. The small profits threshold only matters for those BELOW £6,845 who might voluntarily pay to protect benefits."
  },
  {
    id: 154, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Is a pension commencement lump sum always 25% of the entire pension fund?",
    a: "No. 25% of the PENSION FUND BEING CRYSTALLISED, subject to the Lump Sum Allowance of £268,275.\n\nIf the pension fund is very large, 25% may exceed £268,275 — the excess PCLS is taxed as income."
  },
  {
    id: 155, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A person dies leaving £200,000 to spouse and £400,000 to children. NRB is £325,000. What IHT is due?",
    a: "£30,000. Spouse exemption removes £200,000 from IHT. Only £400,000 passes to children. NRB covers £325,000 → £75,000 taxable at 40% = £30,000.\n\nDo NOT apply the NRB to the entire estate before deducting exemptions."
  },
  {
    id: 156, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: When CGT current-year losses are set against gains, must they reduce gains below the annual exempt amount?",
    a: "YES — current-year losses MUST be set against gains first, EVEN IF this wastes the annual exempt amount.\n\nOnly BROUGHT-FORWARD losses can be restricted to stop the net gain falling below the AEA."
  },
  {
    id: 157, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A non-reporting offshore fund investor dies. Is the gain triggered?",
    a: "Yes. Death is treated as a DISPOSAL for non-reporting funds, triggering an OFFSHORE INCOME GAIN taxable as income at the date of death.\n\nThis is different from reporting funds where death is not a disposal."
  },
  {
    id: 158, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A higher-rate taxpayer receives a REIT property income distribution (PID). Is it taxed as dividend income?",
    a: "No. PIDs are treated as PROPERTY INCOME, not dividend income.\n\nPaid net of 20% tax. Higher-rate taxpayers pay a FURTHER 20% (total 40%). The dividend allowance does NOT apply.\n\nContrast: non-PID dividends from REITs are taxed as ordinary dividends."
  },
  {
    id: 159, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does claiming under the FIG regime affect the personal allowance?",
    a: "Yes — making ANY FIG claim (even just for foreign gains) results in the loss of BOTH:\n- The personal allowance, AND\n- The CGT annual exempt amount\n\nfor that tax year."
  },
  {
    id: 160, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A purchased life annuity is fully taxable as income. True or false?",
    a: "FALSE. A PLA has:\n(a) CAPITAL ELEMENT — non-taxable (return of original capital)\n(b) INTEREST ELEMENT — taxable as savings income\n\nContrast: a PENSION ANNUITY is FULLY taxable as earned income (no tax-free element)."
  },
  {
    id: 161, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: For SDLT, the 5% additional property surcharge applies only when the buyer owns more than one property at the time of purchase. True or false?",
    a: "True — but the precise test is ownership at the END OF THE DAY of purchase.\n\nIf buying a new main residence AND selling the old one on the same day, the surcharge may not apply if the old property is sold first. If NOT sold, the surcharge applies but can be reclaimed within 3 years if the old property is then sold."
  },
  {
    id: 162, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: For IHT annual exemption, can the current year's exemption be saved and used next year?",
    a: "No. The CURRENT YEAR'S exemption must always be used FIRST. Any PRIOR YEAR unused balance can be added — but the current year's full £3,000 must be exhausted before the carry-forward is used."
  },
  {
    id: 163, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can a taxpayer take payments on account of CGT alongside income tax payments on account?",
    a: "No. CGT is NOT included in payments on account.\n\nCGT (except residential property disposals requiring the 60-day report) is due as a BALANCING PAYMENT on 31 January following the end of the tax year."
  },
  {
    id: 164, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does AIM company business relief (IHT) change in 2026?",
    a: "Yes. From 6 APRIL 2026:\n- AIM shares will only qualify for 50% business relief (currently 100%)\n- A £1 million lifetime cap applies for 100% business relief (across all qualifying assets)\n- Assets above £1m get only 50% relief"
  },
  {
    id: 165, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: What happens to pension funds on death from 6 April 2027?",
    a: "Most UNUSED pension funds will become subject to IHT and included in the deceased's estate.\n\nException: transfers to spouse/civil partner remain exempt.\n\nCurrently (before 6 April 2027) pension funds are excluded property and escape IHT entirely."
  }
];

/* ───────────────────────────────────────────────────
   STORAGE
─────────────────────────────────────────────────── */
const STORAGE_KEY = 'r03_progress_v2';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  queueCloudSync();
}

/* ───────────────────────────────────────────────────
   APP STATE
─────────────────────────────────────────────────── */
let progress = loadProgress(); // { cardId: { status, seen, knownCount, unknownCount, lastSeen } }
let currentView = 'dashboard';
let session = null; // active study session
let selectedDecks = new Set(CARDS_RAW.map(c => c.deck));

/* ───────────────────────────────────────────────────
   UTILITY FUNCTIONS
─────────────────────────────────────────────────── */
function getCardProgress(id) {
  return progress[id] || { status: 'unseen', seen: 0, knownCount: 0, unknownCount: 0, lastSeen: null };
}

function setCardProgress(id, update) {
  progress[id] = { ...getCardProgress(id), ...update };
  saveProgress(progress);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function el(id) { return document.getElementById(id); }

/* ───────────────────────────────────────────────────
   STATS COMPUTATION
─────────────────────────────────────────────────── */
function computeStats() {
  const total = CARDS_RAW.length;
  let known = 0, unknown = 0, unseen = 0;
  CARDS_RAW.forEach(c => {
    const p = getCardProgress(c.id);
    if (p.status === 'known') known++;
    else if (p.status === 'unknown') unknown++;
    else unseen++;
  });

  // By tier
  const tiers = {};
  CARDS_RAW.forEach(c => {
    if (!tiers[c.tier]) tiers[c.tier] = { total: 0, known: 0 };
    tiers[c.tier].total++;
    if (getCardProgress(c.id).status === 'known') tiers[c.tier].known++;
  });

  // By section
  const sections = {};
  CARDS_RAW.forEach(c => {
    if (!sections[c.section]) sections[c.section] = { total: 0, known: 0, unknown: 0, unseen: 0 };
    const p = getCardProgress(c.id).status;
    sections[c.section].total++;
    if (p === 'known') sections[c.section].known++;
    else if (p === 'unknown') sections[c.section].unknown++;
    else sections[c.section].unseen++;
  });

  // By deck
  const decks = {};
  CARDS_RAW.forEach(c => {
    if (!decks[c.deck]) decks[c.deck] = { total: 0, known: 0 };
    decks[c.deck].total++;
    if (getCardProgress(c.id).status === 'known') decks[c.deck].known++;
  });

  // By category
  const cats = {};
  CARDS_RAW.forEach(c => {
    if (!cats[c.category]) cats[c.category] = { total: 0, known: 0 };
    cats[c.category].total++;
    if (getCardProgress(c.id).status === 'known') cats[c.category].known++;
  });

  // Exam traps
  const trapCards = CARDS_RAW.filter(c => c.category === 'Common Exam Trap');
  const trapKnown = trapCards.filter(c => getCardProgress(c.id).status === 'known').length;

  // Tier 1
  const t1Total = tiers['Tier 1'] ? tiers['Tier 1'].total : 0;
  const t1Known = tiers['Tier 1'] ? tiers['Tier 1'].known : 0;

  return { total, known, unknown, unseen, tiers, sections, decks, cats, trapCards, trapKnown, t1Total, t1Known };
}

function computeReadiness(stats) {
  const t1Pct = pct(stats.t1Known, stats.t1Total);
  const trapPct = pct(stats.trapKnown, stats.trapCards.length);

  let badge = 'not-ready', label = 'Not Ready';
  let detail = 'Focus on Tier 1 essential cards — they are the foundation of passing.';

  if (t1Pct >= 90 && trapPct >= 80) {
    badge = 'strong'; label = 'Strong Pass Probability';
    detail = `Tier 1 mastery: ${t1Pct}%. Exam trap mastery: ${trapPct}%. Excellent exam readiness.`;
  } else if (t1Pct >= 80) {
    badge = 'likely'; label = 'Likely Pass';
    detail = `Tier 1 mastery: ${t1Pct}%. Review remaining Tier 1 cards and exam traps to strengthen further.`;
  } else if (t1Pct >= 60) {
    badge = 'borderline'; label = 'Borderline';
    detail = `Tier 1 mastery: ${t1Pct}%. You need to consolidate Tier 1 knowledge before exam day.`;
  } else {
    detail = `Tier 1 mastery: ${t1Pct}%. Focus heavily on Tier 1 cards — these are essential to pass.`;
  }

  return { badge, label, detail, t1Pct, trapPct };
}

/* ───────────────────────────────────────────────────
   NAVIGATION
─────────────────────────────────────────────────── */
function navigateTo(view, opts = {}) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = el(`view-${view}`);
  if (!target) return;
  target.classList.add('active');
  currentView = view;

  const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Close sidebar on mobile
  el('sidebar').classList.remove('open');
  el('overlay').classList.remove('active');

  if (view === 'dashboard') updateDashboard();
  if (view === 'analytics') updateAnalytics();
  if (view === 'settings') updateSettings();
  if (view === 'browser') { renderBrowserList(); updateBookmarkBadges(); }
  if (view === 'study') {
    showModeSelector();
    updateDeckFilter();
    updateUnseenBadge();
    if (opts.mode) startSession(opts.mode);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ───────────────────────────────────────────────────
   DASHBOARD
─────────────────────────────────────────────────── */
function updateDashboard() {
  const stats = computeStats();
  const readiness = computeReadiness(stats);

  // Stats
  el('statTotal').textContent = stats.total;
  el('statKnown').textContent = stats.known;
  el('statUnknown').textContent = stats.unknown;
  el('statUnseen').textContent = stats.unseen;
  el('statPct').textContent = pct(stats.known, stats.total) + '%';

  // Update unseen mode count badge on study page
  const unseenBadge = el('unseenModeCount');
  if (unseenBadge) unseenBadge.textContent = stats.unseen > 0 ? `${stats.unseen} cards` : 'All seen!';

  // Readiness
  const badge = el('readinessBadge');
  badge.textContent = readiness.label;
  badge.className = 'readiness-badge ' + readiness.badge;
  el('readinessDetail').textContent = readiness.detail;
  el('t1ProgressBar').style.width = readiness.t1Pct + '%';
  el('t1Pct').textContent = readiness.t1Pct + '%';

  // Trap stats
  el('trapKnown').textContent = stats.trapKnown;
  el('trapUnknown').textContent = stats.trapCards.length - stats.trapKnown;
  el('trapTotal').textContent = stats.trapCards.length;
  el('trapBar').style.width = readiness.trapPct + '%';
  el('trapPct').textContent = readiness.trapPct + '% mastery';

  // Tier list
  const tierNames = ['Tier 1', 'Tier 2', 'Tier 3'];
  const tierColors = ['tier1-fill', 'progress-bar-fill', 'known-fill'];
  el('tierList').innerHTML = tierNames.map((t, i) => {
    const data = stats.tiers[t] || { total: 0, known: 0 };
    const p = pct(data.known, data.total);
    return `<div class="tier-row">
      <div class="tier-row-header">
        <span class="tier-row-name">${t}</span>
        <span class="tier-row-pct">${data.known}/${data.total} (${p}%)</span>
      </div>
      <div class="progress-bar-track">
        <div class="${tierColors[i]}" style="width:${p}%"></div>
      </div>
    </div>`;
  }).join('');

  // Recommendations
  const recos = buildRecommendations(stats);
  el('recoList').innerHTML = recos.map(r => `
    <div class="reco-item">
      <span class="reco-badge ${r.badgeClass}">${r.badge}</span>
      <span class="reco-text">${r.text}</span>
      <span class="reco-count">${r.count}</span>
    </div>`).join('') || '<div class="reco-item"><span class="reco-text">🎉 Great work! Keep reviewing to maintain mastery.</span></div>';

  // Section breakdown
  const sortedSections = Object.entries(stats.sections).sort((a, b) => {
    const pa = pct(a[1].known, a[1].total);
    const pb = pct(b[1].known, b[1].total);
    return pa - pb;
  });
  el('sectionBreakdown').innerHTML = sortedSections.map(([name, data]) => {
    const p = pct(data.known, data.total);
    return `<div class="sec-row">
      <span class="sec-name">${name}</span>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${p}%"></div>
      </div>
      <span class="sec-pct">${p}%</span>
    </div>`;
  }).join('');
}

function buildRecommendations(stats) {
  const recos = [];

  // Unseen cards
  if (stats.unseen > 0) {
    recos.push({ badge: 'UNSEEN', badgeClass: 'unseen', text: 'Cards you have never studied', count: `${stats.unseen} not yet seen` });
  }

  // Tier 1 unknowns
  const t1Unknown = CARDS_RAW.filter(c =>
    c.tier === 'Tier 1' && getCardProgress(c.id).status !== 'known'
  );
  if (t1Unknown.length > 0) {
    recos.push({ badge: 'TIER 1', badgeClass: 't1', text: 'Tier 1 essential cards not yet mastered', count: `${t1Unknown.length} remaining` });
  }

  // Exam trap unknowns
  const trapUnknown = CARDS_RAW.filter(c =>
    c.category === 'Common Exam Trap' && getCardProgress(c.id).status !== 'known'
  );
  if (trapUnknown.length > 0) {
    recos.push({ badge: 'TRAP', badgeClass: 'trap', text: 'Exam trap cards not yet mastered', count: `${trapUnknown.length} remaining` });
  }

  // Weakest section
  const sections = stats.sections;
  let weakSection = null, weakPct = 100;
  Object.entries(sections).forEach(([name, data]) => {
    const p = pct(data.known, data.total);
    if (p < weakPct && data.total > 0) { weakPct = p; weakSection = name; }
  });
  if (weakSection && weakPct < 80) {
    recos.push({ badge: 'WEAK', badgeClass: 'weak', text: `Weakest section: ${weakSection}`, count: `${weakPct}% mastery` });
  }

  return recos.slice(0, 5);
}

function updateUnseenBadge() {
  const stats = computeStats();
  const unseenBadge = el('unseenModeCount');
  if (unseenBadge) {
    unseenBadge.textContent = stats.unseen > 0 ? `${stats.unseen} cards` : 'All seen!';
    unseenBadge.style.background = stats.unseen > 0 ? 'var(--trap-soft)' : 'var(--known-soft)';
    unseenBadge.style.color = stats.unseen > 0 ? 'var(--trap)' : 'var(--known)';
  }
}

/* ───────────────────────────────────────────────────
   STUDY MODES
─────────────────────────────────────────────────── */
function updateDeckFilter() {
  const decks = [...new Set(CARDS_RAW.map(c => c.deck))];
  el('deckFilterGrid').innerHTML = decks.map(d => {
    const sel = selectedDecks.has(d);
    return `<div class="deck-chip ${sel ? 'selected' : ''}" data-deck="${escHtml(d)}">${escHtml(d)}</div>`;
  }).join('');

  el('deckFilterGrid').querySelectorAll('.deck-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const deck = chip.dataset.deck;
      if (selectedDecks.has(deck)) selectedDecks.delete(deck);
      else selectedDecks.add(deck);
      chip.classList.toggle('selected', selectedDecks.has(deck));
    });
  });
}

function getCardsForMode(mode) {
  let pool = CARDS_RAW.filter(c => selectedDecks.has(c.deck));

  switch (mode) {
    case 'all':
      return shuffle(pool);
    case 'unseen':
      return shuffle(pool.filter(c => getCardProgress(c.id).status === 'unseen'));
    case 'unknown':
      return shuffle(pool.filter(c => getCardProgress(c.id).status === 'unknown'));
    case 'tier1':
      return shuffle(pool.filter(c => c.tier === 'Tier 1'));
    case 'traps':
      return shuffle(pool.filter(c => c.category === 'Common Exam Trap'));
    case 'quick':
      return shuffle(pool.filter(c => getCardProgress(c.id).status !== 'known'));
    case 'mock': {
      const t1 = shuffle(pool.filter(c => c.tier === 'Tier 1' && getCardProgress(c.id).status !== 'known'));
      const traps = shuffle(pool.filter(c => c.category === 'Common Exam Trap' && getCardProgress(c.id).status !== 'known'));
      const others = shuffle(pool.filter(c => c.tier !== 'Tier 1' && c.category !== 'Common Exam Trap' && getCardProgress(c.id).status !== 'known'));
      return [...t1, ...traps, ...others];
    }
    default:
      return shuffle(pool);
  }
}

const MODE_LABELS = {
  all: 'Study All',
  unseen: 'Unseen Only',
  unknown: 'Unknown Only',
  tier1: 'Tier 1 Essentials',
  traps: 'Exam Traps',
  quick: 'Quick Pass',
  mock: 'Mock Revision'
};

function startSession(mode) {
  const cards = getCardsForMode(mode);
  if (cards.length === 0) {
    showModeSelector();
    alert('No cards match this mode and your current deck selection. All may already be marked as Known!');
    return;
  }

  session = {
    mode,
    queue: [...cards],
    original: [...cards],
    knownThisSession: 0,
    totalStarted: cards.length,
    dontKnowThisSession: 0,
    undoStack: []  // each entry: { card, prevProgress, action }
  };

  el('study-mode-selector').classList.add('hidden');
  el('study-session').classList.remove('hidden');
  el('sessionComplete').classList.add('hidden');
  el('cardContainer').classList.remove('hidden');
  el('cardActions').classList.add('hidden');
  el('btnUndo').classList.add('hidden');
  el('sessionMode').textContent = MODE_LABELS[mode] || mode;

  showCard();
}

function showModeSelector() {
  el('study-mode-selector').classList.remove('hidden');
  el('study-session').classList.add('hidden');
  session = null;
}

function showCard() {
  if (!session || session.queue.length === 0) {
    endSession();
    return;
  }

  const card = session.queue[0];
  const p = getCardProgress(card.id);

  // Meta chips
  const tierClass = card.tier === 'Tier 1' ? 'meta-tier1' : card.tier === 'Tier 2' ? 'meta-tier2' : 'meta-tier3';
  const isTrap = card.category === 'Common Exam Trap';
  el('cardMeta').innerHTML =
    `<span class="meta-chip ${tierClass}">${escHtml(card.tier)}</span>` +
    (isTrap ? `<span class="meta-chip meta-trap">⚠ Exam Trap</span>` : `<span class="meta-chip meta-category">${escHtml(card.category)}</span>`) +
    `<span class="meta-deck">${escHtml(card.deck)}</span>`;

  el('cardQuestion').textContent = card.q;
  el('cardAnswer').textContent = card.a;
  el('cardAnswer').classList.add('hidden');
  el('revealHint').classList.remove('hidden');
  el('cardActions').classList.add('hidden');

  // Progress
  const totalCards = session.original.length;
  const done = session.knownThisSession;
  const progressPct = pct(done, totalCards);
  el('sessionProgressFill').style.width = progressPct + '%';
  el('sessionProgress').textContent = `Card ${done + 1} of ${totalCards}`;
  el('sessionKnown').textContent = `${session.knownThisSession} known`;
  el('sessionUnknown').textContent = `${session.queue.length} remaining`;
}

function revealCard() {
  if (!session || session.queue.length === 0) return;
  el('cardAnswer').classList.remove('hidden');
  el('revealHint').classList.add('hidden');
  el('cardActions').classList.remove('hidden');
}

function markKnow() {
  if (!session || session.queue.length === 0) return;
  const card = session.queue.shift();
  const prevProgress = { ...getCardProgress(card.id) };
  setCardProgress(card.id, {
    status: 'known',
    seen: prevProgress.seen + 1,
    knownCount: prevProgress.knownCount + 1,
    lastSeen: new Date().toISOString()
  });
  session.knownThisSession++;
  session.undoStack.push({ card, prevProgress, action: 'know', queueSnapshot: null });
  el('btnUndo').classList.remove('hidden');
  showCard();
}

function markDontKnow() {
  if (!session || session.queue.length === 0) return;
  const card = session.queue.shift();
  const prevProgress = { ...getCardProgress(card.id) };
  setCardProgress(card.id, {
    status: 'unknown',
    seen: prevProgress.seen + 1,
    unknownCount: prevProgress.unknownCount + 1,
    lastSeen: new Date().toISOString()
  });
  session.dontKnowThisSession++;
  // Push to end of queue so it comes back
  session.queue.push(card);
  session.undoStack.push({ card, prevProgress, action: 'dont-know' });
  el('btnUndo').classList.remove('hidden');
  showCard();
}

function undoLastDecision() {
  if (!session || session.undoStack.length === 0) return;
  const last = session.undoStack.pop();

  // Restore card progress to what it was before
  setCardProgress(last.card.id, last.prevProgress);

  if (last.action === 'know') {
    // Card was removed from queue as known — put it back at front
    session.queue.unshift(last.card);
    session.knownThisSession = Math.max(0, session.knownThisSession - 1);
  } else {
    // Card was pushed to end of queue as unknown — remove it from the end
    const idx = session.queue.lastIndexOf(last.card);
    if (idx !== -1) session.queue.splice(idx, 1);
    else session.queue.pop(); // fallback: remove last item
    session.queue.unshift(last.card);
    session.dontKnowThisSession = Math.max(0, session.dontKnowThisSession - 1);
  }

  if (session.undoStack.length === 0) el('btnUndo').classList.add('hidden');

  // Reset card display (question only, no answer)
  el('cardAnswer').classList.add('hidden');
  el('revealHint').classList.remove('hidden');
  el('cardActions').classList.add('hidden');
  showCard();
}

function endSession() {
  el('cardContainer').classList.add('hidden');
  el('cardActions').classList.add('hidden');
  el('sessionComplete').classList.remove('hidden');

  el('completeSubtitle').textContent = `You reviewed ${session.totalStarted} card${session.totalStarted !== 1 ? 's' : ''} in this session.`;
  el('completeStats').innerHTML = `
    <div class="complete-stat"><span class="complete-stat-num" style="color:var(--known)">${session.knownThisSession}</span><span class="complete-stat-label">Marked Known</span></div>
    <div class="complete-stat"><span class="complete-stat-num" style="color:var(--unknown)">${session.dontKnowThisSession}</span><span class="complete-stat-label">Still Learning</span></div>
    <div class="complete-stat"><span class="complete-stat-num">${session.totalStarted}</span><span class="complete-stat-label">Cards Seen</span></div>`;
}

/* ───────────────────────────────────────────────────
   ANALYTICS
─────────────────────────────────────────────────── */
function updateAnalytics() {
  const stats = computeStats();
  const overallPct = pct(stats.known, stats.total);

  el('donutPct').textContent = overallPct + '%';
  drawDonut(stats.known, stats.unknown, stats.unseen, stats.total);

  // Tier bars
  const tierNames = ['Tier 1', 'Tier 2', 'Tier 3'];
  el('tierBars').innerHTML = tierNames.map(t => {
    const d = stats.tiers[t] || { total: 0, known: 0 };
    const p = pct(d.known, d.total);
    const colorClass = t === 'Tier 1' ? 'tier1-fill' : t === 'Tier 2' ? 'progress-bar-fill' : 'known-fill';
    return `<div class="analytics-bar-row">
      <div class="analytics-bar-header">
        <span class="analytics-bar-name">${t}</span>
        <span class="analytics-bar-pct">${d.known}/${d.total} (${p}%)</span>
      </div>
      <div class="progress-bar-track"><div class="${colorClass}" style="width:${p}%"></div></div>
    </div>`;
  }).join('');

  // Category bars
  el('catBars').innerHTML = Object.entries(stats.cats).map(([cat, d]) => {
    const p = pct(d.known, d.total);
    const isTrap = cat === 'Common Exam Trap';
    const colorClass = isTrap ? 'trap-fill' : 'progress-bar-fill';
    return `<div class="analytics-bar-row">
      <div class="analytics-bar-header">
        <span class="analytics-bar-name">${isTrap ? '⚠ ' : ''}${escHtml(cat)}</span>
        <span class="analytics-bar-pct">${d.known}/${d.total} (${p}%)</span>
      </div>
      <div class="progress-bar-track"><div class="${colorClass}" style="width:${p}%"></div></div>
    </div>`;
  }).join('');

  // Section table
  el('analyticsTableBody').innerHTML = Object.entries(stats.sections).map(([name, d]) => {
    const p = pct(d.known, d.total);
    return `<tr>
      <td><strong>${escHtml(name)}</strong></td>
      <td>${d.total}</td>
      <td style="color:var(--known)">${d.known}</td>
      <td style="color:var(--unknown)">${d.unknown}</td>
      <td style="color:var(--trap)">${d.unseen}</td>
      <td><div class="mastery-cell">
        <div class="mastery-mini"><div class="progress-bar-track"><div class="progress-bar-fill" style="width:${p}%"></div></div></div>
        <span class="mastery-num">${p}%</span>
      </div></td>
    </tr>`;
  }).join('');

  // Weak areas — cards with highest unknownCount
  const weak = CARDS_RAW
    .filter(c => getCardProgress(c.id).unknownCount > 0)
    .sort((a, b) => getCardProgress(b.id).unknownCount - getCardProgress(a.id).unknownCount)
    .slice(0, 10);

  el('weakList').innerHTML = weak.length === 0
    ? '<div class="reco-item"><span class="reco-text">No weak areas yet — keep studying!</span></div>'
    : weak.map(c => {
      const p = getCardProgress(c.id);
      return `<div class="weak-item">
        <div class="weak-item-left">
          <span class="weak-item-name">${escHtml(c.q.length > 80 ? c.q.slice(0, 80) + '…' : c.q)}</span>
          <span class="weak-item-section">${escHtml(c.deck)}</span>
        </div>
        <div class="weak-item-right">
          <span class="wrong-count">${p.unknownCount}× wrong</span>
        </div>
      </div>`;
    }).join('');
}

function drawDonut(known, unknown, unseen, total) {
  const canvas = el('donutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 200, H = 200, cx = W / 2, cy = H / 2, r = 75, lineW = 22;

  ctx.clearRect(0, 0, W, H);

  const isDark = document.body.classList.contains('dark');
  const segments = [
    { value: known, color: '#059669' },
    { value: unknown, color: '#DC2626' },
    { value: unseen, color: isDark ? '#2D3148' : '#E2E5EB' }
  ];

  let startAngle = -Math.PI / 2;
  segments.forEach(seg => {
    if (!seg.value) return;
    const sliceAngle = (seg.value / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = lineW;
    ctx.stroke();
    startAngle += sliceAngle;
  });

  // Gap effect
  const gapColor = isDark ? '#1A1D27' : '#FFFFFF';
  ctx.strokeStyle = gapColor;
  ctx.lineWidth = lineW + 4;
  ctx.globalAlpha = 0;
  ctx.globalAlpha = 1;
}

/* ───────────────────────────────────────────────────
   SETTINGS
─────────────────────────────────────────────────── */
function updateSettings() {
  const stats = computeStats();
  const decks = Object.entries(stats.decks);

  el('deckResetList').innerHTML = decks.map(([deck, d]) => `
    <div class="deck-reset-item">
      <span class="deck-reset-name">${escHtml(deck)}</span>
      <span class="deck-reset-stats">${d.known}/${d.total} known</span>
      <button class="btn btn-ghost btn-sm" data-deck="${escHtml(deck)}" data-action="reset-deck">Reset</button>
    </div>`).join('');

  el('deckResetList').querySelectorAll('[data-action="reset-deck"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deck = btn.dataset.deck;
      confirmModal(`Reset "${deck}"?`, `This will clear all progress for the "${deck}" deck. This cannot be undone.`, () => {
        CARDS_RAW.filter(c => c.deck === deck).forEach(c => {
          delete progress[c.id];
        });
        saveProgress(progress);
        updateSettings();
      });
    });
  });
}

/* ───────────────────────────────────────────────────
   DATA MANAGEMENT
─────────────────────────────────────────────────── */
function exportProgress() {
  const data = {
    version: 3,
    exportDate: new Date().toISOString(),
    progress,
    bookmarks: getBookmarks(),
    streak: getStreakData(),
    milestones: getEarnedMilestones()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `r03_progress_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.progress) {
        progress = data.progress;
        saveProgress(progress);
        if (data.bookmarks) saveBookmarks(data.bookmarks);
        if (data.streak) saveStreakData(data.streak);
        if (data.milestones) saveEarnedMilestones(data.milestones);
        updateSettings();
        updateBookmarkBadges();
        alert('Progress imported successfully!');
      } else {
        alert('Invalid progress file format.');
      }
    } catch {
      alert('Failed to import: invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

function resetAllProgress() {
  confirmModal('Reset ALL progress?', 'This will clear ALL study data for every card, including cloud-synced data if signed in. This cannot be undone.', async () => {
    progress = {};
    saveProgress(progress);
    saveBookmarks([]);
    saveStreakData({ streak: 0, lastDate: null, totalSessions: 0 });
    saveEarnedMilestones([]);
    updateDashboard();
    updateSettings();
    updateBookmarkBadges();

    if (currentUser && supabaseClient) {
      try {
        await supabaseClient.from('progress').delete().eq('user_id', currentUser.id);
        await supabaseClient.from('user_meta').delete().eq('user_id', currentUser.id);
      } catch (e) { console.warn('Failed to clear cloud data:', e); }
    }
  });
}

/* ───────────────────────────────────────────────────
   MODAL
─────────────────────────────────────────────────── */
let _modalCallback = null;
function confirmModal(title, body, onConfirm) {
  el('modalTitle').textContent = title;
  el('modalBody').textContent = body;
  el('modalBackdrop').classList.remove('hidden');
  _modalCallback = onConfirm;
}

/* ───────────────────────────────────────────────────
   THEME
─────────────────────────────────────────────────── */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.body.classList.toggle('light', !isDark);
  localStorage.setItem('r03_theme', isDark ? 'dark' : 'light');
  el('themeToggle').querySelector('.theme-label').textContent = isDark ? 'Light Mode' : 'Dark Mode';
  // Redraw donut if on analytics
  if (currentView === 'analytics') {
    const stats = computeStats();
    drawDonut(stats.known, stats.unknown, stats.unseen, stats.total);
  }
}

function loadTheme() {
  const saved = localStorage.getItem('r03_theme') || 'light';
  document.body.className = saved;
  el('themeToggle').querySelector('.theme-label').textContent = saved === 'dark' ? 'Light Mode' : 'Dark Mode';
}

/* ───────────────────────────────────────────────────
   HTML ESCAPE
─────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ───────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
─────────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (currentView !== 'study' || !session || session.queue.length === 0) return;

  const answerVisible = !el('cardAnswer').classList.contains('hidden');

  if (e.code === 'Space') {
    e.preventDefault();
    if (!answerVisible) revealCard();
  } else if (e.key === 'k' || e.key === 'K') {
    if (answerVisible) markKnow();
  } else if (e.key === 'd' || e.key === 'D') {
    if (answerVisible) markDontKnow();
  } else if (e.key === 'u' || e.key === 'U') {
    undoLastDecision();
  } else if (e.key === 'n' || e.key === 'N') {
    if (!answerVisible) revealCard();
    else markKnow();
  }
});

/* ───────────────────────────────────────────────────
   EVENT LISTENERS
─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();

  // Nav buttons
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // Dashboard quick start button
  const dashStartBtn = document.querySelector('[data-view="study"][data-mode]');
  if (dashStartBtn) {
    dashStartBtn.addEventListener('click', () => navigateTo('study', { mode: dashStartBtn.dataset.mode }));
  }

  // Theme toggle
  el('themeToggle').addEventListener('click', toggleTheme);

  // Mobile menu
  el('mobileMenuBtn').addEventListener('click', () => {
    el('sidebar').classList.toggle('open');
    el('overlay').classList.toggle('active');
  });
  el('overlay').addEventListener('click', () => {
    el('sidebar').classList.remove('open');
    el('overlay').classList.remove('active');
  });

  // Study mode cards
  document.querySelectorAll('.mode-card[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => startSession(btn.dataset.mode));
  });

  // Deck filter: select all / clear all
  el('selectAllDecks').addEventListener('click', () => {
    selectedDecks = new Set(CARDS_RAW.map(c => c.deck));
    updateDeckFilter();
  });
  el('clearAllDecks').addEventListener('click', () => {
    selectedDecks = new Set();
    updateDeckFilter();
  });

  // Exit session
  el('exitSession').addEventListener('click', showModeSelector);

  // Flashcard reveal
  el('flashcard').addEventListener('click', () => {
    if (el('cardAnswer').classList.contains('hidden')) revealCard();
  });
  el('flashcard').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (el('cardAnswer').classList.contains('hidden')) revealCard();
    }
  });

  // Know / Don't Know
  el('btnKnow').addEventListener('click', markKnow);
  el('btnDontKnow').addEventListener('click', markDontKnow);

  // Undo
  el('btnUndo').addEventListener('click', undoLastDecision);

  // Session complete buttons
  el('restartSession').addEventListener('click', () => {
    if (session) startSession(session.mode);
  });

  // Complete back to dashboard
  el('sessionComplete').querySelector('[data-view]')?.addEventListener('click', function () {
    navigateTo(this.dataset.view);
  });

  // Settings
  el('exportBtn').addEventListener('click', exportProgress);
  el('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importProgress(e.target.files[0]);
      e.target.value = '';
    }
  });
  el('resetAllBtn').addEventListener('click', resetAllProgress);

  // Modal
  el('modalCancel').addEventListener('click', () => el('modalBackdrop').classList.add('hidden'));
  el('modalConfirm').addEventListener('click', () => {
    el('modalBackdrop').classList.add('hidden');
    if (_modalCallback) { _modalCallback(); _modalCallback = null; }
  });
  el('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === el('modalBackdrop')) el('modalBackdrop').classList.add('hidden');
  });

  // "Back to Dashboard" buttons inside views
  document.querySelectorAll('[data-view]').forEach(el => {
    if (!el.classList.contains('nav-btn') && !el.hasAttribute('data-mode')) {
      el.addEventListener('click', function () {
        const view = this.dataset.view;
        if (view) navigateTo(view);
      });
    }
  });

  // Initial render
  updateDashboard();
  updateDeckFilter();
});

/* ═══════════════════════════════════════════════════
   BOOKMARKS
═══════════════════════════════════════════════════ */
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem('r03_bookmarks_v2') || '[]'); } catch { return []; }
}
function saveBookmarks(bm) {
  try { localStorage.setItem('r03_bookmarks_v2', JSON.stringify(bm)); } catch {}
  queueCloudSync();
}
function isBookmarked(id) { return getBookmarks().includes(id); }
function toggleBookmark(id) {
  const bm = getBookmarks();
  const idx = bm.indexOf(id);
  if (idx === -1) bm.push(id);
  else bm.splice(idx, 1);
  saveBookmarks(bm);
  return idx === -1; // true = now bookmarked
}

/* ═══════════════════════════════════════════════════
   STREAK TRACKING
═══════════════════════════════════════════════════ */
function getStreakData() {
  try { return JSON.parse(localStorage.getItem('r03_streak_v2') || '{"streak":0,"lastDate":null,"totalSessions":0}'); }
  catch { return { streak: 0, lastDate: null, totalSessions: 0 }; }
}
function saveStreakData(d) {
  try { localStorage.setItem('r03_streak_v2', JSON.stringify(d)); } catch {}
  queueCloudSync();
}
function updateStreak() {
  const sd = getStreakData();
  const today = new Date().toDateString();
  if (sd.lastDate === today) return sd.streak; // already studied today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (sd.lastDate === yesterday) sd.streak++;
  else if (sd.lastDate !== today) sd.streak = 1; // broken or first time
  sd.lastDate = today;
  sd.totalSessions = (sd.totalSessions || 0) + 1;
  saveStreakData(sd);
  return sd.streak;
}
function getStreak() { return getStreakData().streak; }

/* ═══════════════════════════════════════════════════
   MILESTONES / TOASTS
═══════════════════════════════════════════════════ */
const MILESTONES = [
  { key: 't1_25',  check: s => pct(s.t1Known, s.t1Total) >= 25,  icon: '🌱', title: 'Tier 1: 25% mastered',   desc: 'Good start — keep building.' },
  { key: 't1_50',  check: s => pct(s.t1Known, s.t1Total) >= 50,  icon: '🔥', title: 'Tier 1: Halfway there!',  desc: 'You\'re making real progress.' },
  { key: 't1_75',  check: s => pct(s.t1Known, s.t1Total) >= 75,  icon: '⚡', title: 'Tier 1: 75% mastered',   desc: 'Nearly there on the essentials.' },
  { key: 't1_100', check: s => pct(s.t1Known, s.t1Total) >= 100, icon: '🏆', title: 'Tier 1: Fully mastered!', desc: 'All essential cards known.' },
  { key: 'trap_50',check: s => pct(s.trapKnown, s.trapCards.length) >= 50, icon: '🎯', title: 'Exam Traps: 50% done', desc: 'You\'re avoiding common mistakes.' },
  { key: 'trap_100',check: s => pct(s.trapKnown, s.trapCards.length) >= 100, icon: '🛡', title: 'Exam Traps mastered!', desc: 'No trap should catch you now.' },
  { key: 'all_50', check: s => pct(s.known, s.total) >= 50,  icon: '📈', title: 'Overall: 50% complete', desc: 'More than halfway through all cards.' },
  { key: 'all_100',check: s => pct(s.known, s.total) >= 100, icon: '🎓', title: 'All 165 cards mastered!', desc: 'Maximum exam readiness achieved.' },
  { key: 'streak_3', check: () => getStreak() >= 3,  icon: '🔥', title: '3-day study streak!', desc: 'Consistency is key to retention.' },
  { key: 'streak_7', check: () => getStreak() >= 7,  icon: '💪', title: '7-day streak!',       desc: 'A full week — outstanding.' },
  { key: 'streak_14',check: () => getStreak() >= 14, icon: '🌟', title: '14-day streak!',      desc: 'Two weeks of daily study.' },
];

function getEarnedMilestones() {
  try { return JSON.parse(localStorage.getItem('r03_milestones_v2') || '[]'); } catch { return []; }
}
function saveEarnedMilestones(arr) {
  try { localStorage.setItem('r03_milestones_v2', JSON.stringify(arr)); } catch {}
  queueCloudSync();
}

function checkMilestones(stats) {
  const earned = getEarnedMilestones();
  let toastQueue = [];
  MILESTONES.forEach(m => {
    if (!earned.includes(m.key) && m.check(stats)) {
      earned.push(m.key);
      toastQueue.push(m);
    }
  });
  saveEarnedMilestones(earned);
  // Show toasts sequentially
  toastQueue.forEach((m, i) => setTimeout(() => showToast(m.icon, m.title, m.desc), i * 3500));
}

let _toastTimer = null;
function showToast(icon, title, desc) {
  const t = el('toast');
  el('toastIcon').textContent = icon;
  el('toastTitle').textContent = title;
  el('toastDesc').textContent = desc;
  t.classList.remove('hidden', 'hiding');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.classList.add('hiding');
    setTimeout(() => t.classList.add('hidden'), 260);
  }, 3200);
}

/* ═══════════════════════════════════════════════════
   ESTIMATED TIME TO PASS
═══════════════════════════════════════════════════ */
function computeEstimate(stats) {
  const sd = getStreakData();
  const sessions = sd.totalSessions || 0;
  if (sessions < 2) return null;
  const remaining = stats.total - stats.known;
  if (remaining === 0) return 'You\'re exam ready! 🎓';
  // Very rough: use average known per session so far
  const rate = stats.known / sessions;
  if (rate < 1) return null;
  const sessionsNeeded = Math.ceil(remaining / rate);
  if (sessionsNeeded <= 1) return 'One more session should do it!';
  if (sessionsNeeded <= 3) return `~${sessionsNeeded} more sessions to likely pass`;
  return `~${sessionsNeeded} sessions remaining at current pace`;
}

/* ═══════════════════════════════════════════════════
   CARD BROWSER
═══════════════════════════════════════════════════ */
let browserFilters = { search: '', status: 'all', tier: 'all', category: 'all', section: 'all' };
let browserDetailCardId = null;

function populateSectionFilter() {
  const sections = [...new Set(CARDS_RAW.map(c => c.section))];
  const sel = el('filterSection');
  sections.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
}

function getBrowserCards() {
  const bm = getBookmarks();
  return CARDS_RAW.filter(c => {
    const p = getCardProgress(c.id);
    const bmked = bm.includes(c.id);

    // Status filter
    if (browserFilters.status === 'bookmarked' && !bmked) return false;
    if (browserFilters.status === 'known' && p.status !== 'known') return false;
    if (browserFilters.status === 'unknown' && p.status !== 'unknown') return false;
    if (browserFilters.status === 'unseen' && p.status !== 'unseen') return false;

    // Tier
    if (browserFilters.tier !== 'all' && c.tier !== browserFilters.tier) return false;

    // Category
    if (browserFilters.category !== 'all' && c.category !== browserFilters.category) return false;

    // Section
    if (browserFilters.section !== 'all' && c.section !== browserFilters.section) return false;

    // Search
    if (browserFilters.search) {
      const q = browserFilters.search.toLowerCase();
      if (!c.q.toLowerCase().includes(q) && !c.a.toLowerCase().includes(q) && !c.deck.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

function renderBrowserList() {
  const cards = getBrowserCards();
  const bm = getBookmarks();
  el('browserResultCount').textContent = `${cards.length} card${cards.length !== 1 ? 's' : ''}`;

  if (cards.length === 0) {
    el('browserList').innerHTML = '<div class="reco-item" style="padding:24px;text-align:center;color:var(--text-tertiary);">No cards match your filters.</div>';
    return;
  }

  el('browserList').innerHTML = cards.map(c => {
    const p = getCardProgress(c.id);
    const bmked = bm.includes(c.id);
    const statusClass = bmked ? 'status-bookmarked' : p.status === 'known' ? 'status-known' : p.status === 'unknown' ? 'status-unknown' : 'status-unseen';
    const tierChip = c.tier === 'Tier 1' ? 'browser-chip-t1' : c.tier === 'Tier 2' ? 'browser-chip-t2' : 'browser-chip-t3';
    const isTrap = c.category === 'Common Exam Trap';
    return `<div class="browser-card-row" data-id="${c.id}">
      <div class="browser-status-dot ${statusClass}" title="${bmked ? 'Bookmarked' : p.status}"></div>
      <div class="browser-card-content">
        <div class="browser-card-q">${escHtml(c.q.length > 100 ? c.q.slice(0,100)+'…' : c.q)}</div>
        <div class="browser-card-sub">
          <span class="browser-card-chip ${tierChip}">${escHtml(c.tier)}</span>
          ${isTrap ? '<span class="browser-card-chip browser-chip-trap">⚠ Exam Trap</span>' : `<span class="browser-card-chip browser-chip-cat">${escHtml(c.category)}</span>`}
          <span style="font-size:0.68rem;color:var(--text-tertiary)">${escHtml(c.deck)}</span>
        </div>
      </div>
      <button class="browser-bookmark-btn ${bmked ? 'bookmarked' : ''}" data-bmid="${c.id}" title="${bmked ? 'Remove bookmark' : 'Bookmark'}">
        <svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
      </button>
    </div>`;
  }).join('');

  // Row click → detail
  el('browserList').querySelectorAll('.browser-card-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.browser-bookmark-btn')) return;
      openCardDetail(parseInt(row.dataset.id));
    });
  });

  // Bookmark toggle on row
  el('browserList').querySelectorAll('.browser-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.bmid);
      toggleBookmark(id);
      renderBrowserList();
      updateBookmarkBadges();
    });
  });
}

function openCardDetail(id) {
  const card = CARDS_RAW.find(c => c.id === id);
  if (!card) return;
  browserDetailCardId = id;

  const tierClass = card.tier === 'Tier 1' ? 'meta-tier1' : card.tier === 'Tier 2' ? 'meta-tier2' : 'meta-tier3';
  const isTrap = card.category === 'Common Exam Trap';
  el('cardDetailMeta').innerHTML =
    `<span class="meta-chip ${tierClass}">${escHtml(card.tier)}</span>` +
    (isTrap ? `<span class="meta-chip meta-trap">⚠ Exam Trap</span>` : `<span class="meta-chip meta-category">${escHtml(card.category)}</span>`) +
    `<span class="meta-chip meta-category" style="margin-left:4px">${escHtml(card.deck)}</span>`;

  el('cardDetailQuestion').textContent = card.q;
  el('cardDetailAnswer').textContent = card.a;

  const bmked = isBookmarked(id);
  el('btnBookmarkDetail').classList.toggle('bookmarked', bmked);

  el('cardDetailBackdrop').classList.remove('hidden');
}

function closeCardDetail() {
  el('cardDetailBackdrop').classList.add('hidden');
  browserDetailCardId = null;
}

function updateBookmarkBadges() {
  const bm = getBookmarks();
  const unseenBadge = el('bookmarkModeCount');
  if (unseenBadge) {
    unseenBadge.textContent = bm.length > 0 ? `${bm.length} cards` : 'None yet';
    unseenBadge.style.background = bm.length > 0 ? 'var(--trap-soft)' : 'var(--surface-2)';
    unseenBadge.style.color = bm.length > 0 ? 'var(--trap)' : 'var(--text-tertiary)';
  }
}

/* ═══════════════════════════════════════════════════
   PATCH: updateDashboard — add streak, estimate, milestones
═══════════════════════════════════════════════════ */
const _origUpdateDashboard = updateDashboard;
updateDashboard = function() {
  _origUpdateDashboard();
  const stats = computeStats();

  // Streak
  const streak = getStreak();
  el('streakCount').textContent = streak;

  // Estimate
  const est = computeEstimate(stats);
  el('estimateText').textContent = est || 'Study more cards to estimate time to pass';

  // Milestones (check silently)
  checkMilestones(stats);
};

/* ═══════════════════════════════════════════════════
   PATCH: showCard — bookmark icon + in-session streak
═══════════════════════════════════════════════════ */
const _origShowCard = showCard;
showCard = function() {
  _origShowCard();
  if (!session || session.queue.length === 0) return;
  const card = session.queue[0];

  // Sync bookmark icon
  const bmBtn = el('btnBookmarkCard');
  if (bmBtn) bmBtn.classList.toggle('bookmarked', isBookmarked(card.id));

  // Repeat meta on back face
  const tierClass = card.tier === 'Tier 1' ? 'meta-tier1' : card.tier === 'Tier 2' ? 'meta-tier2' : 'meta-tier3';
  const isTrap = card.category === 'Common Exam Trap';
  const metaBack = el('cardMetaBack');
  if (metaBack) metaBack.innerHTML =
    `<span class="meta-chip ${tierClass}">${escHtml(card.tier)}</span>` +
    (isTrap ? `<span class="meta-chip meta-trap">⚠ Trap</span>` : `<span class="meta-chip meta-category">${escHtml(card.category)}</span>`);

  const qBack = el('cardQuestionBack');
  if (qBack) qBack.textContent = card.q;

  // In-session streak display
  const streakEl = el('sessionStreak');
  if (streakEl) {
    if (session.currentStreak >= 3) {
      streakEl.textContent = `🔥 ${session.currentStreak}`;
      streakEl.classList.remove('hidden');
    } else {
      streakEl.classList.add('hidden');
    }
  }

  // Ensure card is face-up when new card shown
  const fc = el('flashcard');
  if (fc) fc.classList.remove('flipped');
};

/* ═══════════════════════════════════════════════════
   PATCH: revealCard — flip card instead of show text
═══════════════════════════════════════════════════ */
const _origRevealCard = revealCard;
revealCard = function() {
  if (!session || session.queue.length === 0) return;
  const fc = el('flashcard');
  if (fc && !fc.classList.contains('flipped')) {
    fc.classList.add('flipped');
    el('revealHint').classList.add('hidden');
    // Show action buttons after flip starts
    setTimeout(() => {
      el('cardActions').classList.remove('hidden');
    }, 300);
  }
};

/* ═══════════════════════════════════════════════════
   PATCH: startSession — add currentStreak, update streak tracker
═══════════════════════════════════════════════════ */
const _origStartSession = startSession;
startSession = function(mode) {
  _origStartSession(mode);
  if (session) {
    session.currentStreak = 0;
    session.weakCards = []; // track wrong cards this session
  }
  updateStreak(); // record that user studied today
  updateBookmarkBadges();
};

/* ═══════════════════════════════════════════════════
   PATCH: markKnow — increment in-session streak
═══════════════════════════════════════════════════ */
const _origMarkKnow = markKnow;
markKnow = function() {
  if (session) session.currentStreak = (session.currentStreak || 0) + 1;
  _origMarkKnow();
  // Check milestones after marking known
  checkMilestones(computeStats());
};

/* ═══════════════════════════════════════════════════
   PATCH: markDontKnow — reset streak, record weak card
═══════════════════════════════════════════════════ */
const _origMarkDontKnow = markDontKnow;
markDontKnow = function() {
  if (session) {
    session.currentStreak = 0;
    if (session.queue.length > 0) {
      const card = session.queue[0];
      if (!session.weakCards) session.weakCards = [];
      // Add to weak list if not already there
      if (!session.weakCards.find(c => c.id === card.id)) {
        session.weakCards.push(card);
      }
    }
  }
  _origMarkDontKnow();
};

/* ═══════════════════════════════════════════════════
   PATCH: endSession — show weak cards in summary
═══════════════════════════════════════════════════ */
const _origEndSession = endSession;
endSession = function() {
  _origEndSession();
  const weakCards = (session && session.weakCards) ? session.weakCards : [];
  const weakPanel = el('sessionWeakPanel');
  const weakList = el('sessionWeakList');
  if (weakPanel && weakList) {
    if (weakCards.length === 0) {
      weakPanel.classList.add('hidden');
    } else {
      weakPanel.classList.remove('hidden');
      weakList.innerHTML = weakCards.slice(0, 8).map(c =>
        `<div class="session-weak-card">
          ${escHtml(c.q.length > 90 ? c.q.slice(0,90)+'…' : c.q)}
          <div class="session-weak-card-deck">${escHtml(c.deck)}</div>
        </div>`
      ).join('');
    }
  }
  // Update dashboard streak after session
  if (currentView === 'dashboard') updateDashboard();
};

/* ═══════════════════════════════════════════════════
   PATCH: getCardsForMode — add bookmarks mode
═══════════════════════════════════════════════════ */
const _origGetCardsForMode = getCardsForMode;
getCardsForMode = function(mode) {
  if (mode === 'bookmarks') {
    const bm = getBookmarks();
    const pool = CARDS_RAW.filter(c => selectedDecks.has(c.deck) && bm.includes(c.id));
    return shuffle(pool);
  }
  return _origGetCardsForMode(mode);
};

/* ═══════════════════════════════════════════════════
   INIT BROWSER VIEW + NEW EVENT LISTENERS
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  populateSectionFilter();
  updateBookmarkBadges();

  // Nav: browser
  const browserNavBtn = document.querySelector('.nav-btn[data-view="browser"]');
  if (browserNavBtn) {
    browserNavBtn.addEventListener('click', () => {
      navigateTo('browser');
      renderBrowserList();
    });
  }

  // Search
  el('browserSearch').addEventListener('input', e => {
    browserFilters.search = e.target.value.trim();
    el('searchClear').classList.toggle('hidden', !browserFilters.search);
    renderBrowserList();
  });
  el('searchClear').addEventListener('click', () => {
    el('browserSearch').value = '';
    browserFilters.search = '';
    el('searchClear').classList.add('hidden');
    renderBrowserList();
  });

  // Filters
  el('filterStatus').addEventListener('change', () => { browserFilters.status = el('filterStatus').value; renderBrowserList(); });
  el('filterTier').addEventListener('change', () => { browserFilters.tier = el('filterTier').value; renderBrowserList(); });
  el('filterCategory').addEventListener('change', () => { browserFilters.category = el('filterCategory').value; renderBrowserList(); });
  el('filterSection').addEventListener('change', () => { browserFilters.section = el('filterSection').value; renderBrowserList(); });

  // Card detail close
  el('cardDetailClose').addEventListener('click', closeCardDetail);
  el('cardDetailBackdrop').addEventListener('click', e => {
    if (e.target === el('cardDetailBackdrop')) closeCardDetail();
  });

  // Card detail bookmark
  el('btnBookmarkDetail').addEventListener('click', () => {
    if (browserDetailCardId === null) return;
    const nowBm = toggleBookmark(browserDetailCardId);
    el('btnBookmarkDetail').classList.toggle('bookmarked', nowBm);
    updateBookmarkBadges();
    renderBrowserList();
  });

  // Detail mark known/unknown
  el('detailMarkKnown').addEventListener('click', () => {
    if (browserDetailCardId === null) return;
    const p = getCardProgress(browserDetailCardId);
    setCardProgress(browserDetailCardId, { status: 'known', seen: p.seen + 1, knownCount: p.knownCount + 1, lastSeen: new Date().toISOString() });
    checkMilestones(computeStats());
    renderBrowserList();
    closeCardDetail();
  });
  el('detailMarkUnknown').addEventListener('click', () => {
    if (browserDetailCardId === null) return;
    const p = getCardProgress(browserDetailCardId);
    setCardProgress(browserDetailCardId, { status: 'unknown', seen: p.seen + 1, unknownCount: p.unknownCount + 1, lastSeen: new Date().toISOString() });
    renderBrowserList();
    closeCardDetail();
  });

  // Bookmark card in session (B key)
  el('btnBookmarkCard').addEventListener('click', e => {
    e.stopPropagation();
    if (!session || session.queue.length === 0) return;
    const card = session.queue[0];
    const nowBm = toggleBookmark(card.id);
    el('btnBookmarkCard').classList.toggle('bookmarked', nowBm);
    updateBookmarkBadges();
    showToast(nowBm ? '🔖' : '🗑', nowBm ? 'Card bookmarked' : 'Bookmark removed', nowBm ? 'Find it in Bookmarked mode' : 'Removed from bookmarks');
  });

  // Dashboard go to dashboard btn
  const goBtn = el('btnGoToDashboard');
  if (goBtn) goBtn.addEventListener('click', () => navigateTo('dashboard'));

  // Toast click to dismiss
  el('toast').addEventListener('click', () => {
    clearTimeout(_toastTimer);
    el('toast').classList.add('hiding');
    setTimeout(() => el('toast').classList.add('hidden'), 260);
  });
});

/* ═══════════════════════════════════════════════════
   KEYBOARD: add B for bookmark
═══════════════════════════════════════════════════ */
document.addEventListener('keydown', (e2) => {
  if (e2.target.tagName === 'INPUT' || e2.target.tagName === 'TEXTAREA') return;
  if (currentView !== 'study' || !session || session.queue.length === 0) return;
  if (e2.key === 'b' || e2.key === 'B') {
    const card = session.queue[0];
    const nowBm = toggleBookmark(card.id);
    el('btnBookmarkCard').classList.toggle('bookmarked', nowBm);
    updateBookmarkBadges();
    showToast(nowBm ? '🔖' : '🗑', nowBm ? 'Card bookmarked' : 'Bookmark removed', nowBm ? 'Find it in Bookmarked mode' : 'Removed from bookmarks');
  }
}, true); // capture phase so it doesn't conflict with existing listener

/* ═══════════════════════════════════════════════════
   CLOUD SYNC ENGINE
   Strategy: localStorage is always the instant cache.
   Supabase syncs in the background, debounced.
   On login: pull cloud data and MERGE (cloud wins on conflict
   by most-recently-updated, but never silently deletes local-only cards).
═══════════════════════════════════════════════════ */

function setSyncStatus(status) {
  syncStatus = status;
  renderAccountUI();
}

function queueCloudSync() {
  if (!currentUser || !supabaseClient) return; // not signed in — local only
  clearTimeout(syncDebounceTimer);
  setSyncStatus('syncing');
  syncDebounceTimer = setTimeout(() => { pushToCloud(); }, 1200);
}

async function pushToCloud() {
  if (!currentUser || !supabaseClient || !isOnline) {
    setSyncStatus(currentUser ? 'error' : 'local');
    return;
  }
  try {
    // Push progress rows (upsert all cards that have any progress)
    const rows = Object.entries(progress).map(([cardId, p]) => ({
      user_id: currentUser.id,
      card_id: parseInt(cardId),
      status: p.status || 'unseen',
      seen: p.seen || 0,
      known_count: p.knownCount || 0,
      unknown_count: p.unknownCount || 0,
      last_seen: p.lastSeen || null,
      updated_at: new Date().toISOString()
    }));

    if (rows.length > 0) {
      const { error: progErr } = await supabaseClient
        .from('progress')
        .upsert(rows, { onConflict: 'user_id,card_id' });
      if (progErr) throw progErr;
    }

    // Push meta (bookmarks, streak, milestones)
    const sd = getStreakData();
    const { error: metaErr } = await supabaseClient
      .from('user_meta')
      .upsert({
        user_id: currentUser.id,
        bookmarks: getBookmarks(),
        streak: sd.streak || 0,
        last_study_date: sd.lastDate || null,
        total_sessions: sd.totalSessions || 0,
        milestones: getEarnedMilestones(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    if (metaErr) throw metaErr;

    setSyncStatus('synced');
  } catch (e) {
    console.warn('Cloud sync push failed:', e);
    setSyncStatus('error');
  }
}

async function pullFromCloud() {
  if (!currentUser || !supabaseClient) return;
  setSyncStatus('syncing');
  try {
    const { data: progRows, error: progErr } = await supabaseClient
      .from('progress')
      .select('*')
      .eq('user_id', currentUser.id);
    if (progErr) throw progErr;

    const { data: metaRows, error: metaErr } = await supabaseClient
      .from('user_meta')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (metaErr) throw metaErr;

    // Merge progress: cloud row wins if it has a later updated_at OR
    // if local card has never been seen. Local wins if local was
    // updated more recently (covers same-session edits before first sync).
    const localProgress = { ...progress };
    if (progRows && progRows.length > 0) {
      progRows.forEach(row => {
        const cardId = row.card_id;
        const local = localProgress[cardId];
        const cloudUpdated = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const localUpdated = (local && local.lastSeen) ? new Date(local.lastSeen).getTime() : 0;

        if (!local || cloudUpdated >= localUpdated) {
          localProgress[cardId] = {
            status: row.status,
            seen: row.seen,
            knownCount: row.known_count,
            unknownCount: row.unknown_count,
            lastSeen: row.last_seen
          };
        }
      });
    }
    progress = localProgress;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}

    // Merge meta
    if (metaRows) {
      const localBm = new Set(getBookmarks());
      const cloudBm = metaRows.bookmarks || [];
      cloudBm.forEach(id => localBm.add(id));
      try { localStorage.setItem('r03_bookmarks_v2', JSON.stringify([...localBm])); } catch {}

      const localStreak = getStreakData();
      const mergedStreak = {
        streak: Math.max(localStreak.streak || 0, metaRows.streak || 0),
        lastDate: localStreak.lastDate || metaRows.last_study_date,
        totalSessions: Math.max(localStreak.totalSessions || 0, metaRows.total_sessions || 0)
      };
      try { localStorage.setItem('r03_streak_v2', JSON.stringify(mergedStreak)); } catch {}

      const localMs = new Set(getEarnedMilestones());
      (metaRows.milestones || []).forEach(k => localMs.add(k));
      try { localStorage.setItem('r03_milestones_v2', JSON.stringify([...localMs])); } catch {}
    }

    setSyncStatus('synced');

    // Refresh whatever view is currently showing
    if (currentView === 'dashboard') updateDashboard();
    if (currentView === 'analytics') updateAnalytics();
    if (currentView === 'browser') renderBrowserList();
    if (currentView === 'settings') updateSettings();
    updateBookmarkBadges();

    // Push back any local-only data the cloud didn't have
    pushToCloud();
  } catch (e) {
    console.warn('Cloud sync pull failed:', e);
    setSyncStatus('error');
  }
}

function flushSyncQueue() {
  if (currentUser && isOnline) pushToCloud();
}

/* ═══════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════ */
async function initAuth() {
  if (!supabaseClient) {
    // No Supabase available — go straight to offline mode
    showApp();
    return;
  }

  // Listen for auth state changes (handles OAuth redirect callback too)
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      currentUser = session.user;
      renderAccountUI();
      pullFromCloud();
    } else {
      currentUser = null;
      renderAccountUI();
    }
  });

  // Check for existing session
  const { data: { session: existingSession } } = await supabaseClient.auth.getSession();

  if (existingSession && existingSession.user) {
    currentUser = existingSession.user;
    showApp();
    renderAccountUI();
    pullFromCloud();
  } else {
    // No session — show login gate unless user previously chose offline mode
    const skipAuth = localStorage.getItem('r03_skip_auth');
    if (skipAuth === 'true') {
      showApp();
    } else {
      showAuthGate();
    }
  }
}

function showAuthGate() {
  el('authGate').classList.remove('hidden');
}
function hideAuthGate() {
  el('authGate').classList.add('hidden');
}
function showApp() {
  hideAuthGate();
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    showAuthStatus('Cloud sync is unavailable right now.', true);
    return;
  }
  showAuthStatus('Redirecting to Google…', false);
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthStatus('Sign-in failed: ' + error.message, true);
}

async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  currentUser = null;
  localStorage.removeItem('r03_skip_auth');
  renderAccountUI();
  showAuthGate();
}

function continueOffline() {
  localStorage.setItem('r03_skip_auth', 'true');
  showApp();
}

function showAuthStatus(msg, isError) {
  const elx = el('authStatus');
  elx.textContent = msg;
  elx.classList.remove('hidden', 'error');
  if (isError) elx.classList.add('error');
}

/* ═══════════════════════════════════════════════════
   ACCOUNT UI
═══════════════════════════════════════════════════ */
function renderAccountUI() {
  const avatar = el('accountAvatar');
  const email = el('accountEmail');
  const syncStatusEl = el('accountSyncStatus');
  const actionBtn = el('accountActionBtn');

  if (currentUser) {
    const emailStr = currentUser.email || 'Signed in';
    avatar.textContent = emailStr.charAt(0);
    email.textContent = emailStr;
    actionBtn.title = 'Sign out';
    actionBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L17.17 10H9v2h8.17l-1.58 1.58L17 15l4-4zM5 5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V5z"/></svg>`;

    if (syncStatus === 'synced') { syncStatusEl.textContent = 'Synced'; syncStatusEl.className = 'account-sync-status synced'; }
    else if (syncStatus === 'syncing') { syncStatusEl.textContent = 'Syncing…'; syncStatusEl.className = 'account-sync-status syncing'; }
    else if (syncStatus === 'error') { syncStatusEl.textContent = 'Sync error'; syncStatusEl.className = 'account-sync-status local'; }
    else { syncStatusEl.textContent = 'Connecting…'; syncStatusEl.className = 'account-sync-status syncing'; }
  } else {
    avatar.textContent = '?';
    email.textContent = 'Not signed in';
    syncStatusEl.textContent = 'Local only';
    syncStatusEl.className = 'account-sync-status local';
    actionBtn.title = 'Sign in';
    actionBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>`;
  }

  // Settings page mirror
  const sName = el('settingsAccountName');
  const sDesc = el('settingsAccountDesc');
  const sBtn = el('settingsAuthBtn');
  const syncDot = el('syncDot');
  const syncText = el('syncInfoText');

  if (sName && sDesc && sBtn) {
    if (currentUser) {
      sName.textContent = currentUser.email || 'Signed in';
      sDesc.textContent = 'Your progress syncs automatically across all devices';
      sBtn.textContent = 'Sign Out';
    } else {
      sName.textContent = 'Not signed in';
      sDesc.textContent = 'Sign in to sync progress across all your devices';
      sBtn.textContent = 'Sign In';
    }
  }
  if (syncDot && syncText) {
    if (currentUser) {
      if (syncStatus === 'synced') { syncDot.className = 'sync-dot synced'; syncText.textContent = 'All changes saved to the cloud'; }
      else if (syncStatus === 'syncing') { syncDot.className = 'sync-dot syncing'; syncText.textContent = 'Syncing changes…'; }
      else if (syncStatus === 'error') { syncDot.className = 'sync-dot error'; syncText.textContent = 'Sync error — changes saved locally only'; }
      else { syncDot.className = 'sync-dot'; syncText.textContent = 'Connecting to cloud…'; }
    } else {
      syncDot.className = 'sync-dot';
      syncText.textContent = 'Not connected to cloud — sign in to enable sync';
    }
  }
}

/* ═══════════════════════════════════════════════════
   AUTH EVENT LISTENERS
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initAuth();

  el('btnGoogleSignIn').addEventListener('click', signInWithGoogle);
  el('btnContinueOffline').addEventListener('click', continueOffline);

  el('accountActionBtn').addEventListener('click', () => {
    if (currentUser) {
      confirmModal('Sign out?', 'You can sign back in anytime to resume cloud sync. Your local data on this device will remain.', signOut);
    } else {
      showAuthGate();
    }
  });

  const settingsAuthBtn = el('settingsAuthBtn');
  if (settingsAuthBtn) {
    settingsAuthBtn.addEventListener('click', () => {
      if (currentUser) {
        confirmModal('Sign out?', 'You can sign back in anytime to resume cloud sync. Your local data on this device will remain.', signOut);
      } else {
        showAuthGate();
      }
    });
  }
});
