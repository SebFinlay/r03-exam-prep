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
    a: "Non-savings income first (employment, pensions, rental, trading), then savings income, then dividend income, then chargeable gains on life assurance policies (always top).\n\nThis order determines which allowances and rates apply to each type of income.",
    explain: "Think of your income as layers in a cake, stacked from the bottom up.\n\nThe bottom layer is your everyday income (wages, pensions, rent). The next layer is interest from savings. Dividends from shares sit above that. Any payout from a life insurance policy sits right at the top.\n\nThe order matters because it decides which tax-free allowances get used up first — by the time you reach the top layers, you may have less allowance left."
  },
  {
    id: 2, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates and bands for 2026/27 (non-savings, non-dividend income)?",
    a: "Basic rate: 20% on £0–£37,700\nHigher rate: 40% on £37,701–£125,140\nAdditional rate: 45% above £125,140\n\nThese bands sit above the personal allowance of £12,570.",
    explain: "Everyone gets the first £12,570 of income completely tax-free — this is called the personal allowance.\n\nAfter that, income is taxed in slices. The next chunk up to £37,700 is taxed at 20%. The next chunk up to £125,140 is taxed at 40%. Anything above that is taxed at 45%.\n\nYou don't pay the higher rate on your whole income — only on the portion that falls into each band, like filling buckets one at a time."
  },
  {
    id: 3, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the dividend tax rates for 2026/27?",
    a: "Basic rate: 10.75%\nHigher rate: 35.75%\nAdditional rate: 39.35%\nFirst £500 dividend allowance at 0% for ALL taxpayers (regardless of rate).",
    explain: "A dividend is a payment a company makes to people who own its shares, usually out of its profits.\n\nEveryone — no matter how much they earn — gets the first £500 of dividends each year completely tax-free.\n\nAbove that £500, the tax rate depends on your income tax band. Dividend rates are always lower than the equivalent income tax rates, because the company has already paid tax on those profits before paying you."
  },
  {
    id: 4, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Personal Savings Allowance (PSA) for 2026/27?",
    a: "Basic-rate taxpayer: £1,000\nHigher-rate taxpayer: £500\nAdditional-rate taxpayer: £0 (nil — no PSA)\n\nSavings income within the PSA is taxed at 0%.",
    explain: "\"Savings income\" mainly means interest you earn from a bank or building society account.\n\nThe Personal Savings Allowance lets you earn some of that interest completely tax-free each year — but how much depends on your tax band.\n\nThe more you earn overall, the smaller this allowance gets, until it disappears completely once you're an additional-rate taxpayer. Interest above your allowance is simply taxed at your normal income tax rate."
  },
  {
    id: 5, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the starting rate for savings income, and when does it apply?",
    a: "0% on up to £5,000 of savings income — but ONLY if non-savings taxable income (after personal allowance) is less than £5,000.\n\nIf non-savings income exceeds £5,000, this rate is unavailable entirely.",
    explain: "This is a separate, extra tax break — on top of the Personal Savings Allowance — designed to help people with very low \"everyday\" income (like wages or pensions).\n\nIf your everyday income is small, you might earn up to £5,000 of savings interest completely tax-free, in addition to your normal savings allowance.\n\nBut as soon as your everyday income passes £5,000, this special rate switches off entirely — it's all-or-nothing based on that threshold."
  },
  {
    id: 6, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A taxpayer has non-savings taxable income of £15,000 (after personal allowance). Can they use the 0% starting rate on savings income?",
    a: "No. The 0% starting rate on savings income only applies when non-savings taxable income is BELOW £5,000. At £15,000 it is completely unavailable.\n\nMany candidates incorrectly think this rate is always available.",
    explain: "This tests the same rule as the previous card, just from the opposite angle.\n\nBecause this person's everyday income (£15,000) is already well above the £5,000 cut-off, the special 0% savings rate simply doesn't apply to them at all — not even partially.\n\nThey would still get their normal Personal Savings Allowance, but this extra starting-rate band is off the table entirely."
  },
  {
    id: 7, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How do gift aid donations and personal pension contributions (paid net) affect the income tax calculation?",
    a: "They extend the BASIC RATE BAND and HIGHER RATE BAND by the gross amount of the payment.\n\nExample: £800 net pension → gross £1,000 → basic rate band becomes £38,700; higher rate band becomes £126,140.\n\nThis gives higher/additional rate taxpayers full marginal relief.",
    explain: "When you donate via \"gift aid,\" or pay into a pension this way, you actually pay a slightly smaller amount than the full value.\n\nThe taxman tops it up to the full (\"gross\") amount behind the scenes, because some tax relief is already built in automatically.\n\nTo make sure higher earners get their full fair share of relief too, the government stretches your tax bands wider by that same gross amount — so more of your income gets taxed at 20% instead of 40% or 45%."
  },
  {
    id: 8, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the personal allowance for 2026/27 and how is it withdrawn?",
    a: "£12,570. Reduced by £1 for every £2 of adjusted net income above £100,000. Fully withdrawn at £125,140.\n\nAdjusted net income = total income minus gross pension contributions and gross gift aid donations.",
    explain: "The personal allowance is the slice of income everyone normally gets completely tax-free.\n\nOnce your income climbs above £100,000, the government starts clawing this allowance back — for every extra £2 you earn, you lose £1 of your tax-free allowance.\n\nBy the time your income reaches £125,140, the entire allowance has been removed, so all of your income becomes taxable."
  },
  {
    id: 9, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What is the effective marginal income tax rate for someone with adjusted net income between £100,000 and £125,140?",
    a: "60%. They pay 40% higher rate tax PLUS lose £1 of personal allowance for every £2 earned — that lost allowance is also taxed at 40%, creating an extra 20%.\n\nTotal = 40% + 20% = 60% effective rate. This is the personal allowance trap.",
    explain: "This combines two effects happening at once.\n\nNormally you'd pay 40% tax on income in this range. But here, every extra £1 you earn also chips away at your tax-free personal allowance — which means even more of your income becomes taxable, adding an extra 20% tax on top.\n\nAdd those two effects together and you get a 60% \"effective\" tax rate — meaning for every extra £1 you earn in this narrow band, you only actually keep 40p."
  },
  {
    id: 10, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How can a taxpayer reduce the 60% personal allowance trap (income £100,000–£125,140)?",
    a: "Make gross pension contributions (via relief at source) or gift aid donations. These reduce adjusted net income, restoring the personal allowance.\n\nResult: effective tax relief of 60p in the £1 on pension contributions made in this band.",
    explain: "Since the 60% tax trap is triggered by income being measured above £100,000, you can escape it by lowering the income figure that gets measured — without losing the money.\n\nPaying into a pension or donating via gift aid both reduce this \"measured\" income, which can restore some or all of the lost personal allowance.\n\nBecause this band carries such a high 60% rate, pension contributions here give unusually generous relief — effectively 60p back for every £1 contributed."
  },
  {
    id: 11, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the marriage allowance for 2026/27 and who can use it?",
    a: "One spouse/civil partner can transfer £1,260 (10% of personal allowance) to the other, giving the recipient a TAX REDUCTION of £252.\n\nOnly available if the RECIPIENT does not pay tax at higher or additional rate.",
    explain: "This is a small tax break for married couples or civil partners where one person doesn't use up all of their own £12,570 personal allowance — usually because they earn very little or nothing.\n\nThat person can give away a slice of their unused allowance to their partner, which directly reduces their partner's tax bill by £252.\n\nIt only works if the partner receiving it is a basic-rate taxpayer — if they earn enough to be in the higher tax band, they're not allowed to use it."
  },
  {
    id: 12, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "How does gift aid work for the charity and the higher-rate donor?",
    a: "Donor pays net amount. Charity reclaims 20% basic rate from HMRC.\n\nHigher-rate taxpayers: the gross donation extends the basic and higher rate bands, meaning more income is taxed at 20% instead of 40% — a further 20% relief.\n\nNon-taxpayers should NOT use gift aid (they may owe the basic rate deduction to HMRC).",
    explain: "When you tick the \"gift aid\" box on a donation, you pay the amount shown, but the charity can then claim an extra 20% on top directly from the tax office.\n\nSo a £80 donation actually becomes £100 for the charity, at no extra cost to you. If you're a higher-rate taxpayer, you get a further bonus: your tax bands stretch wider, so more of your own income gets taxed at 20% instead of 40%.\n\nThe warning at the end matters: if you don't actually pay any tax yourself, you shouldn't use gift aid, because the tax office may come back to recover the 20% top-up claimed on your behalf."
  },
  {
    id: 13, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "A parent puts money into a building society account for their minor child. Child earns £120 interest. Who pays tax on it?",
    a: "The PARENT pays tax on the full £120 (not just the excess over £100).\n\nThe £100 de minimis: if income from parental gifts exceeds £100, the ENTIRE amount is the parent's income — not just the excess. This is all-or-nothing.",
    explain: "Normally, money a child earns is taxed as the child's own income.\n\nBut there's an anti-avoidance rule aimed at parents trying to dodge tax by putting savings in their child's name: if interest from money a parent has given exceeds £100 in a year, the WHOLE amount — not just the bit over £100 — gets taxed as if it were the parent's own income instead.\n\nThis stops parents sheltering large amounts of savings income inside a child's lower tax allowances."
  },
  {
    id: 14, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the high income child benefit charge (HICBC)?",
    a: "Tax charge on individuals with adjusted net income above £60,000 who receive (or whose partner receives) Child Benefit.\n\nCharge: 1% of Child Benefit for every £200 of income over £60,000.\nFull 100% clawback at £80,000.\n\n2026/27 rates: £26.05/week first child, £17.25/week subsequent.",
    explain: "Child Benefit is a regular payment from the government to help with the cost of raising children, paid regardless of how much you earn.\n\nHowever, if either parent in the household earns more than £60,000, the government starts clawing some of it back as an extra tax charge — for every £200 earned above £60,000, 1% of the Child Benefit gets taken back.\n\nBy the time income reaches £80,000, all of the Child Benefit has effectively been cancelled out by this charge, even though the payment itself was still received."
  },
  {
    id: 15, section: "Section 1", deck: "Income Tax — Foundations",
    tier: "Tier 3", category: "Tax Rule",
    q: "What is the annual trading allowance?",
    a: "£1,000. Trading income below £1,000 is exempt and need not be declared. If above £1,000, the £1,000 allowance can be claimed instead of deducting actual expenses.",
    explain: "If you earn a small amount from self-employed or side-hustle activity (like selling crafts or doing odd jobs), the first £1,000 each year is completely tax-free and doesn't even need to be declared.\n\nIf you earn more than £1,000, you have a choice: deduct your actual business expenses as normal, or simply use this flat £1,000 allowance instead — whichever works out better, without needing to keep detailed receipts."
  },

  // ══════════════════════════════════════════════════
  // SECTION 1: EMPLOYEE BENEFITS
  // ══════════════════════════════════════════════════
  {
    id: 16, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Tax Rule",
    q: "A company petrol car has CO₂ emissions of 133 g/km. What is the benefit-in-kind percentage for 2026/27?",
    a: "32%. Emissions are rounded DOWN to the nearest 5 g/km → 130 g/km → 32%.\n\nThe benefit = 32% × list price (including accessories, excluding any employer discount).",
    explain: "When your employer gives you a company car to use privately (not just for work), that's a perk you have to pay tax on — called a \"benefit in kind.\"\n\nThe more polluting the car (measured by CO₂ emissions), the higher the percentage of the car's value gets added to your taxable income each year.\n\nTo find the exact percentage, the emissions figure rounds down to the nearest multiple of 5, then matches against a government table — 133 rounds down to 130, which corresponds to 32%."
  },
  {
    id: 17, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What determines the taxable car benefit — list price, discounted cost to employer, or market value?",
    a: "LIST PRICE (including accessories, ignoring any employer discount).\n\nIf the employer paid £28,750 but the list price is £31,500, the benefit is calculated on £31,500. Discounts are irrelevant.",
    explain: "Companies often negotiate a discount when buying cars in bulk, paying less than the sticker price.\n\nBut for tax purposes, it doesn't matter what your employer actually paid — the taxable benefit always uses the official manufacturer's list price (what an ordinary customer would pay), including any extras fitted.\n\nThis stops employers and employees reducing the tax bill simply by negotiating a good deal on the purchase."
  },
  {
    id: 18, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Is a pool car a taxable benefit?",
    a: "No — provided ALL THREE conditions are met:\n1. Available to MORE than one employee\n2. NOT normally kept overnight at any employee's home\n3. Any private use is INCIDENTAL to business use\n\nIf any condition is missed, it becomes fully taxable.",
    explain: "A \"pool car\" is a shared company car that several employees use for work trips, rather than one person's personal company car.\n\nAs long as it's genuinely shared, stays at the office overnight rather than going home with someone, and any private use is only a minor side-effect of business trips, it's treated as a working tool rather than a personal perk — so no tax is charged.\n\nBut if even one of those three conditions isn't met, the tax office treats it as a normal company car, fully taxable."
  },
  {
    id: 19, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A company provides a work bus to employees. Is this a taxable benefit?",
    a: "No. The work bus exemption means no income tax arises regardless of the taxpayer's rate of tax.",
    explain: "If an employer runs a dedicated bus or minibus service purely to bring employees to and from work, this is specifically exempted from tax altogether.\n\nThere's no benefit-in-kind charge at all, no matter how much the employee earns or what tax rate they pay.\n\nThis exemption exists to encourage employers to provide environmentally friendly transport without creating an extra tax burden for staff."
  },
  {
    id: 20, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the fuel benefit calculation for 2026/27?",
    a: "Fuel benefit = same CO₂ % as the car benefit × £29,200 (the set figure for 2026/27).\n\nMaximum: 37% × £29,200 = £10,804.\n\nNo fuel benefit for purely electric vehicles.",
    explain: "If your employer also pays for fuel you use on private journeys in your company car, that's a separate taxable perk on top of the car benefit itself.\n\nYou take the same CO₂-based percentage used for the car and apply it to a fixed government figure (£29,200) rather than the car's actual price — so two people with identically polluting cars pay the same fuel benefit charge regardless of what their car cost.\n\nFully electric cars don't use petrol or diesel, so there's naturally no fuel benefit to tax."
  },
  {
    id: 21, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What NIC applies to most employee benefits in kind?",
    a: "Class 1A — paid by the EMPLOYER ONLY at 15% on the taxable benefit value.\n\nEmployees pay NO NICs on benefits in kind (unless the benefit can easily be converted to cash, which would attract Class 1).",
    explain: "National Insurance is a separate tax from income tax, usually linked to earnings.\n\nWhen an employer provides a perk like a company car or private medical insurance, the employer (not the employee) pays a special 15% National Insurance charge on the value of that perk. The employee only pays the income tax on it, not any National Insurance.\n\nThe exception is if the \"benefit\" could just as easily be handed over as cash — then it's treated more like normal pay, and both sides pay National Insurance on it."
  },
  {
    id: 22, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What are the key features of a beneficial employee loan for tax?",
    a: "Tax on the DIFFERENCE between: interest at official rate (3.75% for 2026/27) and interest actually paid.\n\nLoans of £10,000 or less in AGGREGATE are exempt.\n\nIf loan is written off, the amount written off is a taxable benefit.",
    explain: "If your employer lends you money at a low interest rate (or no interest at all), that's a financial perk, because you're saving money compared to borrowing from a normal lender.\n\nThe tax charge is based on the gap between what you're actually paying and what the government considers a fair \"official\" interest rate — the bigger the gap, the bigger the taxable benefit.\n\nSmall loans (£10,000 or less in total) are ignored completely. If your employer later cancels the loan so you don't have to repay it, that forgiven amount itself becomes taxable, since it's effectively extra income."
  },
  {
    id: 23, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the mileage rate for business use of an employee's own car for income tax purposes?",
    a: "45p per mile for the first 10,000 business miles; 25p per mile thereafter.\n\nPayments within these rates are tax free. Any excess is taxable. For NIC, flat rate 45p applies to all miles.",
    explain: "If you use your own personal car for work trips, your employer can reimburse you for fuel and wear-and-tear using a standard rate per mile, rather than tracking actual costs.\n\nThe government sets these rates — higher for the first 10,000 miles in a year, dropping after that. As long as your employer pays at or below these rates, the reimbursement is completely tax-free.\n\nIf your employer pays more than these rates, the extra counts as taxable income, since it's seen as more than just covering your costs."
  },
  {
    id: 24, section: "Section 1", deck: "Employee Benefits",
    tier: "Tier 3", category: "Tax Rule",
    q: "List five employee benefits that are generally EXEMPT from income tax.",
    a: "1. Group income protection premiums paid by employer\n2. Meals in a staff canteen (available to all staff)\n3. ONE mobile phone\n4. Long service awards (20+ years, ≤£50 per year of service)\n5. Trivial benefits (cost ≤£50 per benefit)",
    explain: "Not every workplace perk is taxable — the government has carved out a list of common, modest benefits that are simply ignored for tax purposes, to avoid unnecessary paperwork over small things.\n\nThese include insurance that protects your income if you're off sick long-term, free meals available to everyone at work, one work mobile phone, small thank-you gifts for very long service, and any minor gift or treat costing £50 or less.\n\nThe common theme: these are either modest in value or genuinely about staff wellbeing, rather than a disguised form of extra pay."
  },
  // ══════════════════════════════════════════════════
  // SECTION 2: NATIONAL INSURANCE CONTRIBUTIONS
  // ══════════════════════════════════════════════════
  {
    id: 25, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 1 employee NIC rates and key thresholds for 2026/27?",
    a: "Lower Earnings Limit (LEL): £129/week — earns benefit entitlement at zero rate\nPrimary Threshold (PT): £242/week\nUpper Earnings Limit (UEL): £967/week\n\nRates: 0% below PT; 8% between PT and UEL; 2% above UEL.",
    explain: "National Insurance is paid on top of income tax, and mainly funds things like the State Pension.\n\nBelow £242 a week you pay nothing. Between £242 and £967 a week, you pay 8% of your earnings. Above £967 a week, the rate drops to just 2% on the extra.\n\nThe £125 figure matters even though no NI is paid there — earning at least that much still counts towards your State Pension record."
  },
  {
    id: 26, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 1 EMPLOYER NIC rates and thresholds for 2026/27?",
    a: "Secondary Threshold: £96/week (£5,000/year)\nRate: 15% on ALL earnings above £96/week — NO upper limit.\n\nEmployment allowance: £10,500 per business (deducted from employer's total secondary NICs). NOT available where sole employee is a director.",
    explain: "Employers also pay their own separate National Insurance on what they pay staff, on top of what the employee pays.\n\nOnce an employee earns more than £96 a week, the employer pays 15% extra — and unlike the employee's NI, there's no upper limit where the rate drops.\n\nSmall businesses get a discount: the first £10,500 of this employer NI bill each year is wiped out completely, though this doesn't apply to a one-person company where the only employee is also the director."
  },
  {
    id: 27, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An employee earns between £125 and £242 per week. Do they pay NICs?",
    a: "No employee NICs are paid. But earnings in this band (LEL to PT) are ZERO-RATED — the employee still builds up entitlement to the State Pension and other contributory benefits.\n\nThis is a critical distinction from below-LEL earnings which confer no benefit entitlement.",
    explain: "No money is actually deducted from this person's pay for National Insurance.\n\nBut the system still treats them as if they had paid it, purely for the purpose of building up their State Pension record — this protects lower earners who would otherwise lose out.\n\nIf they earned even less than £125 a week, this protection would not apply, and that time wouldn't count towards their pension."
  },
  {
    id: 28, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the Class 4 NIC rates and thresholds for self-employed individuals in 2026/27?",
    a: "6% on profits between £12,570 and £50,270\n2% on profits above £50,270\n\nClass 4 NICs do NOT confer any State benefit entitlement — they are purely a tax on profits.",
    explain: "Self-employed people pay a different type of National Insurance than employees, based on their yearly profit rather than their wages.\n\nProfit between £12,570 and £50,270 is taxed at 6%, and anything above that at just 2%.\n\nUnlike most National Insurance, this particular charge doesn't actually build up any pension or benefit entitlement — it functions purely as an extra tax."
  },
  {
    id: 29, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Tax Rule",
    q: "When are Class 2 NICs actually paid in 2026/27?",
    a: "Class 2 NICs (£3.65/week) are DEEMED PAID automatically when self-employed profits are at or above £7,105 (the small profits threshold). No actual payment required.\n\nBELOW £7,105: can pay VOLUNTARILY to maintain State Pension entitlement.",
    explain: "This is the type of self-employed National Insurance that actually protects your State Pension.\n\nIf your yearly profit is £7,105 or more, you're automatically treated as having paid it — no money actually changes hands, and your pension record is protected for free.\n\nIf your profit is below that threshold, you can choose to pay this small weekly amount voluntarily, just to keep your pension record going."
  },
  {
    id: 30, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does paying Class 4 NICs give a self-employed person entitlement to contributory State benefits?",
    a: "No. Class 4 NICs generate NO State benefit entitlement whatsoever.\n\nIt is Class 2 NICs (now mostly deemed paid above the small profits threshold) that protect contributory benefit rights such as the State Pension.",
    explain: "This is a common point of confusion, because self-employed people pay two different types of National Insurance side by side.\n\nClass 4 (the profit-based one from Card 28) is purely a tax — it pays nothing towards your pension.\n\nIt's Class 2 (the flat weekly amount from Card 29) that actually counts towards State Pension and other benefit entitlement."
  },
  {
    id: 31, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Tax Rule",
    q: "How are NICs calculated for a company director?",
    a: "On an ANNUAL EARNINGS PERIOD basis — not weekly or monthly like employees.\n\nAll earnings since 6 April are cumulated on each payment. The annual primary threshold is £12,570 for 2026/27.\n\nThis prevents directors manipulating the timing of payments to reduce NICs.",
    explain: "A normal employee's National Insurance is worked out fresh each pay period, looking only at that week or month's pay.\n\nA company director is treated differently: their NI is worked out by adding up all their pay since the start of the tax year (6 April) every time they're paid, using an annual threshold rather than a weekly one.\n\nThis stops a director from, say, taking one huge payment in week one and paying very little NI on it by exploiting weekly limits."
  },
  {
    id: 32, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Tax Rule",
    q: "What are Class 1A NICs?",
    a: "Employer-only contributions at 15% on most taxable benefits in kind (e.g. company cars, private medical insurance).\n\nNot paid by the employee. Due by 22 July following the end of the tax year.\n\nClass 1 takes priority over Class 1A (so easily convertible benefits attract Class 1, not 1A).",
    explain: "When an employer gives an employee a perk like a company car (see Card 16) rather than cash, the employer has to pay a separate 15% National Insurance charge on the value of that perk.\n\nOnly the employer pays this — the employee doesn't pay any National Insurance on the perk itself.\n\nThis charge is paid once a year, after the tax year ends, rather than throughout the year like normal payroll NI."
  },
  {
    id: 33, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Why is an employee with earnings marginally above the LEL but below the Primary Threshold credited with NICs?",
    a: "Earnings between the LEL (£129/week) and PT (£242/week) are ZERO-RATED — employees in this band are treated as having paid NICs for benefit entitlement purposes (e.g. State Pension) even though no contributions are deducted.\n\nThis protects low earners' rights to State benefits.",
    explain: "This repeats the same idea as Card 27, asking why rather than what.\n\nThe government deliberately built a protective gap into the system: anyone earning at least £125 a week gets their pension record protected, even though they don't actually start paying any National Insurance until they reach £242 a week.\n\nWithout this rule, lower earners working part-time hours could end up with gaps in their pension entitlement."
  },
  {
    id: 34, section: "Section 2", deck: "National Insurance Contributions",
    tier: "Tier 3", category: "Tax Rule",
    q: "What is the Class 3 NIC rate and purpose?",
    a: "£17.75 per week — voluntary contributions to fill gaps in NI contribution records.\n\nCannot be paid in the year of reaching State Pension age or after. Payments can be made up to 6 years retrospectively.",
    explain: "Sometimes someone's National Insurance record has gaps — perhaps they lived abroad, or weren't working for a while.\n\nClass 3 lets anyone top up those missing years by paying a flat weekly amount voluntarily, which protects their eventual State Pension.\n\nThis can be done for past years too (up to six years back), but stops being available once someone reaches State Pension age."
  },

  // ══════════════════════════════════════════════════
  // SECTION 3: CAPITAL GAINS TAX
  // ══════════════════════════════════════════════════
  {
    id: 35, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the CGT rates for individuals in 2026/27?",
    a: "Basic rate: 18% (gains falling within unused basic rate band)\nHigher rate: 24% (gains above basic rate band)\nBusiness Asset Disposal Relief (BADR): 18% always\nInvestors' Relief: 18% always\n\nGains sit on TOP of income. The remaining basic rate band (£37,700 minus taxable non-savings income) determines how much is taxed at 18%.",
    explain: "Capital Gains Tax is charged when you sell something (like shares or a second property) for more than you paid for it.\n\nThe rate you pay depends on your other income: if your normal income hasn't used up your basic rate band, some of the gain is taxed at the lower 18% rate, and only the rest at 24%.\n\nTwo special reliefs for selling parts of a business always get a flat 18% rate, however large your income — useful for higher-rate taxpayers who would otherwise pay 24%."
  },
  {
    id: 36, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "How does a chargeable event gain from a life assurance policy interact with CGT rates in the same year?",
    a: "The TOP-SLICED gain (not the full gain) is added to income for the purpose of calculating remaining basic rate band for CGT.\n\nThe top-sliced gain PRECEDES the CGT gain in the ordering. This can push more of the CGT gain into the 24% band.",
    explain: "If someone cashes in a life insurance bond and also sells shares in the same tax year, the order these are added up in actually matters.\n\nThe bond gain (using a special averaged-down figure called \"top slicing\" — covered in the life assurance section) gets added to income first, which can use up the lower 18% CGT band.\n\nThis means more of the share sale gain may end up taxed at the higher 24% rate than if the bond hadn't been cashed in."
  },
  {
    id: 37, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the CGT annual exempt amount for individuals in 2026/27?",
    a: "£3,000.\n\nCannot be carried forward. Cannot offset income tax.\n\nAllocated against gains in the way that MINIMISES tax (set against gains taxed at the highest rate first).",
    explain: "Everyone gets the first £3,000 of capital gains each year completely tax-free.\n\nIf you don't use it, it's simply lost — you can't save it up for next year, and you can't use it to reduce other types of tax like income tax.\n\nIf you have several gains taxed at different rates, this allowance is used against the gains taxed at the higher rate first, to save you the most tax possible."
  },
  {
    id: 38, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are transfers of assets between spouses/civil partners treated for CGT?",
    a: "No gain, no loss disposal. The recipient spouse takes the asset at the transferor's ORIGINAL BASE COST.\n\nThe full gain crystallises on the recipient's eventual disposal — calculated from the original cost.\n\nUseful for planning: transfer to spouse with unused AEA or lower tax rate.",
    explain: "Normally, giving an asset away counts as a \"disposal\" that can trigger Capital Gains Tax, even though no money changed hands.\n\nBut between married couples or civil partners, this is ignored completely — it's as if the asset simply changed hands at its original cost, with no tax due at the point of transfer.\n\nThis is useful for planning: a couple might move an asset to whichever partner has more of their tax-free allowance left, or pays a lower tax rate, before it's eventually sold."
  },
  {
    id: 39, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "When do no gain/no loss transfers apply to a separating couple?",
    a: "Separating couples have up to THREE YEARS after the end of the tax year in which they cease living together for no gain/no loss transfers.\n\nAssets transferred as part of a FORMAL DIVORCE AGREEMENT have NO time limit.\n\nThe deadline is from end of tax year of separation — not from date of separation.",
    explain: "The tax-free treatment for transfers between spouses (Card 38) doesn't disappear the moment a couple stops living together.\n\nThey get a grace period of three years, counted from the end of the tax year they separated in — not from the exact date — to sort out who keeps what without triggering tax.\n\nIf assets are transferred as part of a formal divorce settlement specifically, there's no time limit at all on this tax-free treatment."
  },
  {
    id: 40, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "Which assets are exempt from CGT? Name the key ones.",
    a: "Gilt-edged securities (gilts)\nQualifying corporate bonds (QCBs)\nISA/Junior ISA/CTF holdings\nVCT shares (on which income tax relief was given)\nEIS/SEIS shares (IT relief given and not withdrawn)\nPrivate motor cars\nMain private residence (PRR)\nNS&I Savings Certificates and Premium Bonds\nDecorations for valour\nGambling winnings",
    explain: "Most things you own and sell at a profit are potentially subject to Capital Gains Tax — but the government has a specific list of exceptions.\n\nThese include UK government loans (gilts), most savings accounts wrapped in an ISA, certain small-company share schemes (VCT/EIS/SEIS) designed to encourage investment, ordinary cars, and your main home.\n\nThe common theme: these are either policy-encouraged investments, everyday possessions, or government savings products the state doesn't want to tax twice."
  },
  {
    id: 41, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is Business Asset Disposal Relief (BADR)?",
    a: "Reduces CGT to 18% on the first £1 million of qualifying lifetime gains.\n\nAssets must be owned for at least 2 years before disposal.\n\nFor company shares: must hold 5%+ AND be an employee or director for at least 2 years.\n\nNote: The rate rose from 14% to 18% on 6 April 2026.",
    explain: "This is a tax incentive for people who build and eventually sell their own business, rather than just passively invest.\n\nInstead of paying the normal 18%/24% Capital Gains Tax rates, qualifying business owners pay just 18% on the first £1 million of profit they make over their lifetime from selling the business.\n\nTo qualify with company shares specifically, you need a meaningful stake (5% or more) and to have actually worked in the business as an employee or director for at least two years — this isn't available to passive outside investors."
  },
  {
    id: 42, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are capital losses in the same year as gains treated?",
    a: "Losses MUST be set against same-year gains first — EVEN if this wastes the annual exempt amount.\n\nUnused losses carry forward indefinitely and are set against future gains AFTER the AEA is deducted.\n\nOne spouse's losses cannot be set against the other's gains.",
    explain: "If you make both gains and losses on different investments in the same tax year, you don't get a choice — the losses must be deducted from the gains automatically before working out tax.\n\nThis can sometimes mean your tax-free allowance (Card 37) goes to waste, because the losses have already wiped out the gains it would have covered.\n\nAny losses left over can be carried forward and used in future years instead, but a married couple can't share losses between each other — each person's losses only offset their own gains."
  },
  {
    id: 43, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a capital loss arise from disposing of an exempt asset?",
    a: "No. If the asset is EXEMPT from CGT (e.g. gilts, QCBs, VCT shares), no loss can arise either.\n\nThe exemption works both ways — no gains AND no losses.",
    explain: "If an asset is on the exempt list from Card 40, the exemption cuts both ways.\n\nYou won't be taxed if you make a profit selling it, but equally, you can't claim a loss to offset other gains if you sell it for less than you paid.\n\nThese assets sit completely outside the Capital Gains Tax system, for better or worse."
  },
  {
    id: 44, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the share identification rules for CGT?",
    a: "Disposals matched with acquisitions in this order:\n1. Same day acquisitions\n2. Acquisitions within the FOLLOWING 30 days (prevents bed-and-breakfasting)\n3. The share POOL — all other acquisitions at weighted average cost",
    explain: "If you've bought shares in the same company on different dates at different prices, and then sell some, the tax office needs a rule for which specific shares you're treated as having sold.\n\nFirst, any shares bought on the very same day as the sale are matched together. Next, any shares bought in the 30 days right after the sale are matched. Anything left over comes from a \"pool\" of all your other shares, averaged together.\n\nThis specific order exists mainly to stop a tax-avoidance trick explained in the next card."
  },
  {
    id: 45, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor sells shares and buys the same shares back the next day. What CGT applies?",
    a: "If repurchased within 30 days, the disposal is MATCHED WITH THE REPURCHASE — not the original pool cost. This eliminates the gain/loss.\n\nThis is the 30-day rule preventing 'bed and breakfasting.' To realise a gain/loss the investor must wait 30 days before repurchasing.",
    explain: "Some investors used to try a trick: sell shares to lock in a tax loss, then immediately buy them straight back, ending the day owning exactly what they started with but now able to claim a loss for tax purposes.\n\nThe 30-day rule from Card 44 blocks this — if you buy the same shares back within 30 days, the sale is matched against that repurchase rather than your original cost, so no real gain or loss is recognised.\n\nTo genuinely realise a gain or loss, you have to stay out of that share for the full 30 days before buying back in."
  },
  {
    id: 46, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is holdover relief in CGT?",
    a: "A gift of trading business assets or a gift attracting an immediate IHT charge (e.g. into a discretionary trust) can be 'held over.'\n\nNo CGT at the time of gift. The gain REDUCES the donee's base cost. Both donor and donee must jointly claim (except gifts to trusts — donor claims alone).",
    explain: "Normally, giving away an asset for free can still trigger Capital Gains Tax, because the tax office treats it as if it were sold at its market value.\n\nFor certain gifts — like business assets, or gifts into a trust — this tax can instead be \"held over,\" meaning it's postponed rather than charged immediately.\n\nThe person receiving the gift effectively inherits the original lower cost, so the postponed gain gets taxed eventually when they sell it themselves."
  },
  {
    id: 47, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the CGT annual exempt amount and rate for trustees in 2026/27?",
    a: "Rate: 24% on ALL chargeable assets (residential property also 24%).\nAnnual exempt amount: £1,500 (halved vs. individual).\n\nFurther reduced if same settlor has multiple trusts:\n2 trusts: £750 each | 3 trusts: £500 each | 4 trusts: £375 each | 5+ trusts: £300 each (minimum)",
    explain: "A trust is a legal arrangement where assets are held by trustees on behalf of beneficiaries, rather than owned directly by an individual.\n\nTrustees pay a flat 24% rate on any gains — there's no lower 18% band like individuals get — and their tax-free allowance is only half of an individual's, at £1,500.\n\nIf the same person has set up several different trusts, that already-smaller allowance gets divided even further between them, to stop people multiplying their tax-free allowance by creating multiple trusts."
  },
  {
    id: 48, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "When must CGT on a UK residential property disposal be paid?",
    a: "Within 60 DAYS of completion of the disposal — via an online property report (payment on account).\n\nFinal settlement through self assessment by 31 January following the tax year.\n\nThis 60-day rule applies even to trustees.",
    explain: "Unlike most Capital Gains Tax, which is settled once a year through a tax return, selling a residential property (that isn't your main home) has a fast separate deadline.\n\nYou must report the sale and pay an estimate of the tax within 60 days of the sale completing — not wait until the normal tax return deadline.\n\nThis quick payment is then reconciled with everything else when the full tax return is filed the following January."
  },
  {
    id: 49, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is business rollover relief?",
    a: "When a business sells a qualifying asset (land, fixed plant, goodwill for individuals) and buys replacement qualifying business assets within 1 year before/3 years after disposal, the gain can be ROLLED INTO the new asset's cost. No immediate CGT.",
    explain: "If a business sells one qualifying asset (like a building) and uses the proceeds to buy a replacement business asset within a set window of time, the tax on that profit doesn't have to be paid right away.\n\nInstead, the gain effectively gets carried forward and \"rolled into\" the cost of the new asset, deferring the tax until that new asset is eventually sold without being replaced again.\n\nThis encourages businesses to keep reinvesting in growth, rather than being taxed every time they upgrade their assets."
  },
  {
    id: 50, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the private residence relief (PRR) final period exemption?",
    a: "The last 9 MONTHS of ownership are always treated as occupied (exempt), provided the property was the main residence at SOME POINT.\n\nExtends to 36 months for disabled persons and those in long-term care.",
    explain: "Selling your main home is usually completely free of Capital Gains Tax. But what if you'd already moved out before the sale completed, perhaps while waiting for a buyer?\n\nThe rules are generous here: the final 9 months of ownership are always treated as if you still lived there, even if you'd actually moved out, as long as it was genuinely your home at some earlier point.\n\nThis grace period stretches to a full 3 years for people who had to move into long-term care or who are disabled."
  },
  {
    id: 51, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is the chattel CGT exemption?",
    a: "Chattels (tangible movable property) with disposal proceeds of £6,000 or less: FULLY EXEMPT.\n\nIf proceeds exceed £6,000: gain cannot exceed 5/3 × (proceeds − £6,000).\n\nExample: ring sold for £7,800 — max gain = 5/3 × £1,800 = £3,000.",
    explain: "A \"chattel\" simply means a physical, movable item you own — like jewellery, antiques, or art (as opposed to property or land).\n\nIf you sell one for £6,000 or less, there's no Capital Gains Tax at all, regardless of profit.\n\nIf you sell it for more than £6,000, there's a special cap that limits how much of the extra amount over £6,000 can actually be taxed, so the tax bill doesn't become disproportionate to how far over the threshold you went."
  },
  {
    id: 52, section: "Section 3", deck: "Capital Gains Tax",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Can 'clogged losses' from a connected person disposal be used against other gains?",
    a: "No. Losses on transactions with CONNECTED PERSONS can only be set against gains from the SAME connected person.\n\nThey cannot be used against other capital gains. This prevents artificial loss creation between connected parties.",
    explain: "A \"connected person\" generally means a close relative or a business you control.\n\nIf you sell something to one of these people at a loss, the tax office is suspicious that the deal might not have been at a genuine arm's-length price — so it restricts how that loss can be used.\n\nThis loss gets \"locked\" (or \"clogged\") so it can only be offset against future gains made from deals with that exact same connected person, not against any of your other capital gains."
  },

  // ══════════════════════════════════════════════════
  // SECTION 4: INHERITANCE TAX
  // ══════════════════════════════════════════════════
  {
    id: 53, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the IHT nil rate band (NRB) for 2026/27?",
    a: "£325,000. Frozen until 5 April 2031.\n\nIHT at death: 40% on excess above NRB.\nLifetime CLT rate: 20% on excess above NRB.\nReduced rate of 36% if 10%+ of net estate left to UK charity.",
    explain: "Inheritance Tax is charged on the value of what someone leaves behind when they die, or certain large gifts made during their lifetime.\n\nEveryone gets a tax-free slice first — currently £325,000 — and only the amount above that gets taxed, usually at 40% on death.\n\nLeaving a meaningful share (10% or more) of your estate to charity reduces the overall rate to 36%, as an incentive for charitable giving."
  },
  {
    id: 54, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Residence Nil Rate Band (RNRB) for 2026/27?",
    a: "£175,000. Frozen until 5 April 2031.\n\nAvailable only where a qualifying residence passes to DIRECT DESCENDANTS on death.\n\nTapered at £1 per £2 of net estate above £2m. Unused RNRB can be transferred to surviving spouse.",
    explain: "This is an extra tax-free allowance, on top of the main one in Card 53, specifically for passing on a home.\n\nIf your house goes to your children or grandchildren when you die, an additional £175,000 escapes Inheritance Tax.\n\nThis bonus shrinks for very large estates (above £2 million) and disappears completely above a certain point, but like the main allowance, any unused portion can pass to a surviving spouse."
  },
  {
    id: 55, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a Potentially Exempt Transfer (PET)?",
    a: "A lifetime gift by an individual to:\n(a) Another individual\n(b) A bare/absolute trust\n(c) A disabled trust\n\nNo IHT at date of gift. No need to report to HMRC.\nSurvive 7 years → fully exempt.\nDie within 7 years → becomes chargeable at death rates (subject to taper relief if 3+ years).",
    explain: "If you give money or property directly to another person while you're alive, this gift doesn't trigger any tax at the moment you make it — it's only \"potentially\" taxable.\n\nIf you survive 7 full years after making the gift, it becomes completely tax-free for good.\n\nBut if you die within those 7 years, the gift becomes taxable after all, as if it were part of your estate — though the tax can be reduced if you survived at least 3 years (see taper relief)."
  },
  {
    id: 56, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Principle",
    q: "Why must PETs be tracked even though they generate no IHT at the time of the gift?",
    a: "A failed PET USES UP THE NRB — it erodes the nil rate band available for the death estate.\n\nEven if a PET within the NRB generates no IHT on itself, it reduces the NRB available for subsequent CLTs and the death estate — potentially costing substantial tax.",
    explain: "Even though a gift from Card 55 doesn't get taxed immediately, it still matters for record-keeping.\n\nIf the person dies within 7 years, that gift gets counted first against their tax-free allowance — meaning less of that allowance is left over to cover the rest of their estate when they die.\n\nSo a gift that seemed \"free\" at the time can still end up costing real tax later, by quietly using up tax-free room that would otherwise protect other assets."
  },
  {
    id: 57, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a Chargeable Lifetime Transfer (CLT)?",
    a: "A lifetime transfer that is NEITHER exempt NOR a PET — most commonly a gift into a discretionary trust (or most other trusts created on/after 22 March 2006).\n\nTax: 20% on excess over cumulative NRB at date of transfer.\nIf donor dies within 7 years: recalculated at 40% with taper relief; lifetime tax paid as credit.",
    explain: "Unlike the simple gifts in Card 55, some lifetime gifts — most commonly putting money into certain types of trust — are taxed straight away, rather than just \"potentially\" later.\n\nThe gift is taxed at 20% on anything above your remaining tax-free allowance, right at the time it's made.\n\nIf the person then dies within 7 years, the tax gets recalculated at the full 40% death rate, with the 20% already paid given as credit against the larger bill."
  },
  {
    id: 58, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is taper relief for IHT and how does it work?",
    a: "Reduces IHT payable on PETs/CLTs where donor survives 3–7 years:\n3–4 years: 80% of full tax\n4–5 years: 60% of full tax\n5–6 years: 40% of full tax\n6–7 years: 20% of full tax\n7+ years: nil (fully exempt)\n\nTaper reduces the TAX — not the value of the transfer in cumulation.",
    explain: "It reduces the tax owed on a gift if the giver dies 3–7 years after making it — the longer they survive, the less tax.\n\nThe discount rises in stages: die in year 3–4 and 80% of the full tax is owed; die in year 6–7 and only 20% is owed; survive the full 7 years and none at all is owed.\n\nImportant: this only reduces the tax bill on that specific gift — it does not reduce the gift's value for working out tax on anything else, which is a common exam trap."
  },
  {
    id: 59, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does taper relief reduce the value of a gift counted in the 7-year cumulation?",
    a: "NO. Taper relief only reduces the IHT PAYABLE on that specific transfer.\n\nThe FULL VALUE of the gift still counts in cumulation and erodes the nil rate band for future transfers. Many candidates confuse this.",
    explain: "This is testing the same trap flagged at the end of Card 58, but directly.\n\nEven though taper relief might cut the actual tax bill to as little as 20% of normal, the FULL original value of the gift still counts when working out how much tax-free allowance is left for later gifts or the death estate.\n\nThe discount only applies to the tax cheque — not to how the gift is recorded for other calculations."
  },
  {
    id: 60, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the IHT cumulation principle?",
    a: "All chargeable transfers (CLTs + failed PETs) in the 7 years BEFORE any new transfer are added together.\n\nThe NRB is set against the cumulative total — only the EXCESS is taxed.\n\nA transfer drops out of cumulation once more than 7 years old.",
    explain: "Your tax-free allowance isn't reset every time you make a gift — it's shared across everything you've given away in the last 7 years.\n\nEach time you make a new taxable gift, the tax office adds up all your taxable gifts from the previous 7 years, and only lets the remaining unused portion of your allowance count.\n\nOnce a gift passes its own 7-year anniversary, it drops out of this running total and stops affecting later gifts."
  },
  {
    id: 61, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "List the main IHT lifetime exemptions.",
    a: "Spouse/civil partner: Unlimited (long-term UK resident)\nAnnual exemption: £3,000 per donor per tax year (unused portion carries forward 1 year only — current year used first)\nSmall gifts: £250 per donee per year (cannot top up other exemptions)\nNormal expenditure from income: Unlimited (habitual, from income, no reduction in standard of living)\nWedding/civil partnership gifts: £5,000 parent | £2,500 grandparent | £1,000 other\nCharity gifts: Unlimited",
    explain: "Not every gift counts towards the 7-year tracking system in Card 60 — several common types of giving are simply exempt outright.\n\nGifts to your spouse, charity gifts, a small annual allowance (£3,000), tiny gifts under £250, regular giving from your spare income, and wedding gifts up to set limits all escape Inheritance Tax entirely, with no tracking needed.\n\nThese exemptions exist to let people support family and good causes without being penalised, as long as they stay within sensible everyday limits."
  },
  {
    id: 62, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can the £3,000 annual IHT exemption and the £250 small gifts exemption be combined for a single gift?",
    a: "No. The small gifts exemption cannot 'top up' a gift already partially covered by the annual exemption.\n\nIf the annual exemption is used for part of a gift, the £250 exemption cannot cover the excess.",
    explain: "These are two separate, independent allowances from Card 61, and they can't be stacked on the same gift.\n\nIf you give someone, say, £3,200 and try to cover £3,000 with your annual exemption and the remaining £200 with the small gifts allowance, this isn't allowed — the small gifts exemption can only be used for a gift it covers completely on its own.\n\nThey can be used for different gifts to different people in the same year, just not combined on one single gift."
  },
  {
    id: 63, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "How many years can unused IHT annual exemption be carried forward?",
    a: "ONE year only.\n\nUnused portion from year 1 can be carried to year 2 giving £4,500 maximum — but ONLY if the current year's £3,000 is used first.\n\nAny remaining unused amount is PERMANENTLY LOST after 1 year.",
    explain: "If you don't use your £3,000 annual gift allowance from Card 61 in a given year, it isn't lost immediately — you get one extra year to use it.\n\nThis means in the following year you could theoretically give away up to £4,500 tax-free (£3,000 for that year plus £1,500 carried over, for example) — but only after fully using the current year's allowance first.\n\nAfter that single extra year, any amount still unused disappears for good."
  },
  {
    id: 64, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the three conditions for the 'normal expenditure from income' IHT exemption?",
    a: "1. Habitual/regular — part of the transferor's normal pattern of expenditure\n2. Made from INCOME (not capital)\n3. After the payment, the transferor has sufficient income to maintain their usual STANDARD OF LIVING\n\nNo maximum amount — ideal for regular life policy premium payments.",
    explain: "This is one of the most generous IHT exemptions, because it has no upper limit at all — but three conditions must all be met.\n\nThe giving has to be a regular, repeated pattern (not a one-off), it has to come from spare income rather than savings or selling assets, and the giver must still be left with enough to live on as normal afterwards.\n\nA common real-world example is someone regularly paying premiums on a life insurance policy for someone else, out of their monthly income."
  },
  {
    id: 65, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is the unused NRB of a deceased spouse transferred?",
    a: "The proportion of NRB UNUSED on first death transfers to the surviving spouse as a percentage.\n\nOn second death: that percentage × NRB in force at SECOND DEATH.\n\nMaximum increase: 100% (doubling the NRB). Upper limit prevents exceeding double NRB.",
    explain: "Since gifts between spouses are tax-free (Card 61), many people leave everything to their spouse first, using none of their own tax-free allowance.\n\nWhatever percentage of that allowance was left unused on the first death can be passed on to the surviving spouse, to use on top of their own allowance when they later die.\n\nIt's worked out as a percentage rather than a fixed amount, because the tax-free allowance itself might be a different figure by the time the second spouse dies — and the most you can ever get is double the normal allowance."
  },
  {
    id: 66, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is a gift with reservation (GWR) for IHT?",
    a: "A gift where the donor CONTINUES TO ENJOY A BENEFIT from the property.\n\nResult: property remains in the donor's estate for IHT at its DEATH VALUE — potential double charge.\n\nExample: giving a house to a child but continuing to live there rent-free.",
    explain: "This rule stops people pretending to give something away while secretly still benefiting from it, just to dodge Inheritance Tax.\n\nIf you give away an asset but keep using it as if you still owned it — like giving your house to your child but continuing to live there for free — the tax office treats it as if you never really gave it away at all.\n\nIt stays counted as part of your estate when you die, valued at whatever it's worth at that point, defeating the purpose of trying to give it away early."
  },
  {
    id: 67, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "If a parent gifts a house to a child but pays full market rent, is it a gift with reservation?",
    a: "No. Payment of FULL MARKET RENT from the outset prevents GWR — the gift is an outright PET.\n\nIf the rent later drops below market rate, GWR begins from THAT DATE. The property then enters the donor's estate.",
    explain: "There's a clean way around the rule in Card 66: if the parent genuinely pays the going market rate to live in the house they gave away, this isn't seen as secretly benefiting for free — it's a proper, fair arrangement.\n\nIn that case, the gift counts as a normal lifetime gift (a PET) and can become fully tax-free after 7 years.\n\nBut if the rent is later reduced below the market rate, the \"gift with reservation\" rule kicks in from that point onward, and the property starts being dragged back into the estate again."
  },
  {
    id: 68, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is business relief (BR) for IHT and the rates?",
    a: "100% BR: unincorporated businesses; shareholdings of ANY SIZE in unquoted/AIM companies.\n50% BR: controlling shareholdings in fully listed companies; land/buildings/plant used in owner's business.\n\nMust be owned for at least 2 years.\n\nImportant: from 6 April 2026, £1m lifetime cap on 100% BR; AIM shares drop to 50%.",
    explain: "This relief encourages people to keep running real businesses rather than selling up purely to avoid Inheritance Tax problems.\n\nOwning your own business outright, or shares in a smaller/unlisted company, gets a full 100% reduction in Inheritance Tax. Owning shares in a large, fully listed company, or business property used in your own trade, only gets a 50% reduction.\n\nYou have to have owned the qualifying asset for at least 2 years for any of this to apply — it's not available for last-minute purchases."
  },
  {
    id: 69, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the IHT rules for a discretionary trust — entry, periodic, and exit charges?",
    a: "Entry (CLT): 20% on excess over available NRB at time of transfer.\n\nPeriodic (10-year anniversary): max 6% of trust value (30% × 20% × value above NRB at that time).\n\nExit: proportional to last periodic rate × quarters held since last ten-year anniversary ÷ 40.",
    explain: "A discretionary trust (where trustees decide how to distribute money rather than it going automatically to named people) faces tax charges at three separate points in its life.\n\nWhen money first goes into the trust, there's an entry charge (the same 20% CLT rate from Card 57). Every 10 years afterwards, there's a periodic charge of up to 6% on the trust's value, to stop trusts being used to avoid tax indefinitely.\n\nIf money leaves the trust between these 10-year points, a smaller proportional exit charge applies too, based on how long since the last 10-year charge."
  },
  {
    id: 70, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 1", category: "Tax Rule",
    q: "When is IHT on the death estate due?",
    a: "6 months after the END OF THE MONTH of death (not 6 months from the date of death).\n\nPayable by the LEGAL PERSONAL REPRESENTATIVES (LPRs).\n\nInterest accrues from the due date on any unpaid tax.",
    explain: "When someone dies, their executors (the people legally responsible for sorting out their affairs) have a deadline to pay any Inheritance Tax due.\n\nThis deadline is measured from the end of the calendar month the person died in, not from the exact date — so someone who dies on 3 March and someone who dies on 29 March both have the same payment deadline.\n\nIf the tax isn't paid by then, interest starts being charged on the outstanding amount."
  },
  {
    id: 71, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "Does the RNRB apply to lifetime transfers becoming chargeable on death?",
    a: "No. The RNRB is ONLY available against the death estate.\n\nIt CANNOT be set against PETs or CLTs even when they become chargeable as a result of death.",
    explain: "The extra home allowance from Card 54 has a narrower use than the main tax-free allowance.\n\nIt can only ever be set against what's left in someone's estate when they die — it cannot be used to reduce the tax on a lifetime gift, even if that gift becomes taxable because the person died within 7 years of making it.\n\nOnly the main nil rate band (Card 53) can be used for those lifetime gifts."
  },
  {
    id: 72, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is quick succession relief (QSR)?",
    a: "Where IHT was paid on a transfer and the beneficiary dies within 5 years, a percentage of that IHT is credited against the second death's tax:\n0–1 year: 100% | 1–2 years: 80% | 2–3 years: 60% | 3–4 years: 40% | 4–5 years: 20%",
    explain: "This relief softens the blow when the same money effectively gets taxed twice in quick succession — for example, if someone inherits money, pays Inheritance Tax on it, and then sadly dies themselves shortly afterwards.\n\nA percentage of the tax already paid on the first inheritance is given as a credit against the tax due on the second death, and the sooner the second death happens, the bigger that credit is.\n\nThis recognises that taxing the same wealth twice within a few years would be unreasonably harsh."
  },
  {
    id: 73, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Tax Rule",
    q: "What is Pre-Owned Assets Tax (POAT)?",
    a: "An INCOME TAX charge on the annual benefit enjoyed from assets the taxpayer has previously gifted (since 18 March 1986) and continues to benefit from.\n\nNo charge if the annual benefit ≤ £5,000.\nDoes NOT apply if the asset is already caught by GWR.",
    explain: "This is a separate backstop rule, charged as income tax rather than Inheritance Tax, aimed at older or more creative attempts to give away assets while still benefiting from them.\n\nIf someone finds a clever way to keep enjoying an asset they technically gave away (without falling foul of the gift-with-reservation rule in Card 66), this tax charges them income tax each year based on the value of that ongoing benefit.\n\nThere's a small de minimis: if the benefit is worth £5,000 or less a year, no charge applies."
  },
  {
    id: 74, section: "Section 4", deck: "Inheritance Tax — Foundations",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "In what order must IHT calculations be performed when someone dies having made both PETs and CLTs?",
    a: "Go back to the EARLIEST transfer within 7 years of death. For each transfer calculate the 7-year cumulation at the DATE OF THAT TRANSFER (CLTs and failed PETs within 7 years of that gift). Apply NRB and taper relief. Finally calculate IHT on the death estate using remaining NRB.",
    explain: "When someone dies having made several gifts over the years, working out the tax requires going through them in chronological order, oldest first.\n\nFor each individual gift, you have to look back 7 years from THAT gift's own date (not from the date of death) to see what other gifts were already \"in the cumulation\" at that point, then work out the tax owed on it.\n\nOnly once all the lifetime gifts have been processed this way do you finally calculate the tax on whatever is left in the estate, using whatever tax-free allowance remains."
  },

  // ══════════════════════════════════════════════════
  // SECTION 5: RESIDENCE
  // ══════════════════════════════════════════════════
  {
    id: 75, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the automatic UK residence tests for 2026/27?",
    a: "Automatically UK RESIDENT if:\n(a) 183+ days in UK in the tax year, OR\n(b) UK home held for 91+ consecutive days (30 in the tax year) with no overseas home used 30+ days, OR\n(c) Full-time work in UK for 365 days.",
    explain: "Whether you're a UK tax resident affects what income and gains the UK can tax you on.\n\nThere are a few clear-cut situations that automatically make you UK resident: simply spending more than half the year (183+ days) in the UK, having a UK home you genuinely use for a long stretch with no real overseas alternative, or working full-time in the UK for a full year.\n\nIf any one of these applies, you don't need to look at anything else — you're automatically resident."
  },
  {
    id: 76, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the automatic non-UK residence tests?",
    a: "Automatically NOT UK resident if:\n(a) Fewer than 16 days in UK, OR\n(b) Not previously resident for 3 years AND fewer than 46 days in UK, OR\n(c) Full-time overseas work (35+ hours/week average) with fewer than 91 days and fewer than 31 working days in UK.",
    explain: "Just as some situations automatically make you a UK resident (Card 75), others automatically rule it out.\n\nSpending almost no time in the UK (under 16 days), being new to the UK and spending under 46 days here, or working full-time overseas with very limited UK visits, all guarantee non-resident status straight away.\n\nAs with the resident tests, meeting just one of these is enough — no further checking needed."
  },
  {
    id: 77, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the 5 UK ties for the Sufficient UK Ties test?",
    a: "1. Family tie: UK-resident spouse/partner/minor children\n2. Accommodation tie: accessible UK accommodation used during the year\n3. Work tie: 40+ days' substantive work in UK\n4. 90-day tie: 90+ days in UK in either of the 2 previous years\n5. Country tie: more days in UK has any other country (only for LEAVERS, not arrivals)",
    explain: "Many people don't fall neatly into the automatic resident or non-resident categories from Cards 75–76 — for them, the number of UK ties they have, combined with days spent in the UK, decides their status.\n\nThese five ties look at things like having close family in the UK, having accessible accommodation here, working here regularly, having spent significant time here in recent years, and (for people leaving the UK specifically) spending more time here than anywhere else.\n\nThe more of these ties someone has, the fewer days they can spend in the UK before becoming resident."
  },
  {
    id: 78, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the FIG regime?",
    a: "Foreign Income and Gains regime. A qualifying new resident (not UK resident for 10 consecutive years before arrival) can claim 100% relief from UK tax on foreign income and gains for the FIRST 4 TAX YEARS of UK residence.\n\nClaiming loses the personal allowance AND CGT annual exempt amount for that year.",
    explain: "This is a tax break for people genuinely new to the UK, replacing an older system that used to exist for non-domiciled individuals.\n\nIf you haven't been UK resident for a full 10 years beforehand, you can shelter your foreign income and gains completely from UK tax for your first 4 years of living here.\n\nThere's a trade-off though: claiming this means giving up your normal UK personal allowance and Capital Gains Tax exemption for that particular year."
  },
  {
    id: 79, section: "Section 5", deck: "Residence and Statutory Tests",
    tier: "Tier 2", category: "Tax Rule",
    q: "For IHT purposes, what does 'long-term resident' mean?",
    a: "Being UK tax resident for at least 10 out of the previous 20 tax years.\n\nLong-term residents: liable to IHT on WORLDWIDE assets.\nNon-long-term residents: IHT only on UK-situated assets.",
    explain: "Residence status (Cards 75–78) matters for income tax, but Inheritance Tax uses its own separate, longer-term test.\n\nIf you've been UK resident for 10 or more of the last 20 tax years, the UK can charge Inheritance Tax on everything you own worldwide, not just UK assets.\n\nIf you haven't reached that 10-year threshold, the UK can only tax your UK-based assets for Inheritance Tax purposes."
  },

  // ══════════════════════════════════════════════════
  // SECTION 6: TAX COMPLIANCE & SELF ASSESSMENT
  // ══════════════════════════════════════════════════
  {
    id: 80, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Process",
    q: "What are the key self assessment dates for the 2026/27 tax year?",
    a: "31 January 2027: 1st payment on account (50% of 2025/26 SA liability)\n31 July 2027: 2nd payment on account\n31 October 2027: Paper return deadline\n31 January 2028: Online return + balancing payment due\n\nCGT (not residential property) and voluntary Class 2 NICs are included in the balancing payment only.",
    explain: "If you have to file a tax return yourself (self assessment), there are several key dates throughout the year rather than just one.\n\nTwo advance payments are usually due in January and July, based on an estimate from the previous year's tax bill. The actual return must then be filed — earlier if on paper, later if online — with any remaining balance due at the very end.\n\nThese dates repeat every year on a rolling cycle, always covering the previous tax year's income."
  },
  {
    id: 81, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are payments on account and when are they NOT required?",
    a: "Two payments of 50% each of the PREVIOUS YEAR'S SA liability (income tax + Class 4 NICs, but NOT CGT or Class 2 NICs).\n\nNOT required if:\n- SA liability below £1,000, OR\n- 80%+ of previous year's liability was collected via PAYE/at source",
    explain: "Rather than waiting until the end of the year to collect all your tax at once, the tax office asks self-employed and other self-assessment taxpayers to pay roughly half their expected bill twice during the year, in advance.\n\nThese estimated payments are based on what you owed last year, split into two equal chunks.\n\nIf last year's bill was small (under £1,000), or if most of your tax is already being collected automatically through other means, you don't need to make these advance payments at all."
  },
  {
    id: 82, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Ramsay principle?",
    a: "A judicial anti-avoidance doctrine looking at the OVERALL RESULT of a series of pre-arranged transactions rather than each step individually.\n\nIf steps have no commercial purpose other than tax avoidance, HMRC can ignore them and tax the net economic result.",
    explain: "Sometimes people try to avoid tax through a complicated chain of artificial steps that, taken together, achieve nothing real except dodging tax.\n\nThis principle, established by the courts, lets the tax office look past the individual steps and instead tax the overall economic outcome — as if the artificial steps in between never happened.\n\nIt only applies where the steps genuinely have no real business purpose other than avoiding tax."
  },
  {
    id: 83, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the General Anti-Abuse Rule (GAAR)?",
    a: "Applies to tax arrangements that are ABUSIVE (cannot reasonably be regarded as a reasonable course of action).\n\nApplies to all main taxes EXCEPT VAT.\nPenalty: up to 60% of counteracted tax.\nIndependent GAAR advisory panel provides opinions.",
    explain: "This is a broad legal power the tax office can use against tax avoidance schemes that are simply too aggressive to be considered reasonable.\n\nIf an arrangement is so artificial or extreme that no sensible person would consider it a normal way to organise their affairs, this rule lets the tax office cancel out the tax advantage entirely — and add a hefty penalty on top.\n\nIt applies to most major UK taxes, though not VAT, and an independent panel reviews cases to check the rule is being applied fairly."
  },
  {
    id: 84, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 1", category: "Comparison",
    q: "Distinguish between tax evasion, tax avoidance, and tax mitigation.",
    a: "EVASION: Illegal. Deliberately not declaring taxable income/gains. Criminal offence. Penalties + possible imprisonment.\n\nAVOIDANCE: Legal arrangements to reduce tax — but increasingly challenged by GAAR and Ramsay.\n\nMITIGATION: Straightforward use of available reliefs, exemptions, allowances — fully legitimate.",
    explain: "These three terms sound similar but mean very different things, and the exam often tests the distinction.\n\nEvasion is simply breaking the law — hiding income from the tax office, which is a criminal offence.\n\nAvoidance is technically legal but pushes the rules to their limits in artificial ways, which the tax office increasingly challenges using tools like GAAR and Ramsay. Mitigation is the most innocent: simply using the reliefs and allowances Parliament intended you to use, like an ISA or pension contributions, which is entirely uncontroversial."
  },
  {
    id: 85, section: "Section 6", deck: "Tax Compliance and Self Assessment",
    tier: "Tier 2", category: "Process",
    q: "What is DOTAS?",
    a: "Disclosure Of Tax Avoidance Schemes. Promoters must REGISTER avoidance schemes with HMRC. Each registered scheme receives a number. Users must quote the number on their tax return.\n\nRegistration does NOT mean HMRC approves the scheme.",
    explain: "This is a transparency rule aimed at companies and advisers who sell aggressive tax avoidance schemes to clients.\n\nThose promoters are legally required to tell the tax office about the scheme upfront, and it gets a reference number that anyone using it must include on their own tax return.\n\nThis doesn't mean the scheme is officially approved — it simply means the tax office knows it exists and can keep an eye on it, often as a precursor to challenging it."
  },

  // ══════════════════════════════════════════════════
  // SECTION 7: STAMP DUTIES
  // ══════════════════════════════════════════════════
  {
    id: 86, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What SDLT applies to a £400,000 residential property purchase (non-first-time buyer, only property)?",
    a: "£0–£125,000: 0% = £0\n£125,001–£250,000: 2% = £2,500\n£250,001–£400,000: 5% = £7,500\nTotal SDLT: £10,000\n\nSDLT is calculated on SLICES — different rates apply to different portions.",
    explain: "Stamp Duty Land Tax is the tax paid when buying property in England and Northern Ireland, and like income tax bands, it's charged in slices rather than one flat rate on the whole price.\n\nThe first £125,000 of the price is tax-free, the next slice up to £250,000 is taxed at 2%, and the remaining amount up to £400,000 is taxed at 5%.\n\nAdding these slices together gives the total bill — you never pay the higher rate on the whole purchase price, only on the portion that falls in each band."
  },
  {
    id: 87, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is first-time buyer SDLT relief?",
    a: "Up to £300,000: 0%.\n£300,001–£500,000: 5% on excess over £300,000.\nAbove £500,000: FULL normal rates apply — relief lost entirely.\n\nAll buyers must be first-time buyers (never owned residential property anywhere in the world).",
    explain: "Genuine first-time buyers get a more generous version of the slices from Card 86, to help them get onto the property ladder.\n\nThe tax-free portion is extended all the way up to £300,000, with only a single 5% rate applying to anything between £300,000 and £500,000.\n\nIf the property costs more than £500,000, this special relief disappears completely, and normal rates apply to the whole price instead — there's no partial benefit above that point."
  },
  {
    id: 88, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the SDLT surcharge for additional residential properties?",
    a: "5% surcharge added to each SDLT band on residential purchases where buyer will own 2+ properties AND is NOT replacing their main residence.\n\nApplies on properties costing £40,000+.",
    explain: "If you're buying a property while already owning another one — like a holiday home or buy-to-let — an extra 5% is added on top of the normal rates from Card 86, applied to every slice.\n\nThis surcharge specifically targets people accumulating multiple properties, rather than those simply moving house.\n\nIf you're selling your only existing home and buying a new main residence to replace it, this extra charge doesn't apply."
  },
  {
    id: 89, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is Stamp Duty Reserve Tax (SDRT) and what rate applies?",
    a: "0.5% on PAPERLESS (electronic) share transactions via CREST.\n\nCharged on the agreement to transfer shares — the broker pays SDRT; it appears on the contract note.\n\nStamp duty (on paper transfers) is also 0.5% — rounded UP to the nearest £5.",
    explain: "Buying shares also has its own stamp tax, separate from property stamp duty entirely.\n\nMost share trading today happens electronically through a system called CREST, and this electronic version of the tax is called SDRT, charged at 0.5% of the purchase price.\n\nOlder-style paper share transfers use a slightly different version simply called stamp duty, at the same 0.5% rate but rounded up to the nearest £5."
  },
  {
    id: 90, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "What stamp duty applies to purchases of AIM-listed company shares?",
    a: "NEITHER stamp duty NOR SDRT. Transactions in AIM shares (and AQSE Growth Market) are EXEMPT.\n\nThis also applies to UK-based exchange-traded funds (ETFs).\n\nGilts are also exempt from both stamp duty and SDRT.",
    explain: "AIM is a stock market for smaller, growing companies, separate from the main London Stock Exchange.\n\nAs an incentive to invest in these smaller companies, buying AIM-listed shares is completely exempt from both versions of share stamp tax described in Card 89.\n\nThe same exemption applies to UK government bonds (gilts) and UK exchange-traded funds, so none of the usual 0.5% charge applies to any of these."
  },
  {
    id: 91, section: "Section 7", deck: "Stamp Duties — SDLT and SDRT",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor buys shares using a stock transfer FORM (paper). What applies — stamp duty or SDRT?",
    a: "STAMP DUTY (on the paper document/stock transfer form) at 0.5%, rounded up to nearest £5.\n\nSDRT applies to PAPERLESS/electronic transfers. Both rates are 0.5% but different rules apply.",
    explain: "This tests the distinction made in Card 89 directly.\n\nIf the share purchase uses an old-fashioned paper form rather than the electronic CREST system, it's stamp duty that applies, not SDRT — even though the rate (0.5%) is the same.\n\nThe key difference candidates often miss is the rounding: paper stamp duty rounds up to the nearest £5, while electronic SDRT doesn't round at all."
  },

  // ══════════════════════════════════════════════════
  // SECTION 8: VAT AND CORPORATION TAX
  // ══════════════════════════════════════════════════
  {
    id: 92, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the VAT registration and deregistration thresholds for 2026/27?",
    a: "Registration threshold: £90,000 (rolling 12-month period). Must notify within 30 days; effective 1st of following month.\n\nDeregistration threshold: £88,000.",
    explain: "VAT is a tax added to the price of most goods and services, and businesses only have to start charging it once they reach a certain size.\n\nOnce a business's sales pass £90,000 in any rolling 12-month period (not just the calendar year), it must register for VAT and start charging it.\n\nIf a registered business's turnover later drops below £88,000, it can choose to deregister and stop charging VAT — the threshold is slightly lower to avoid businesses constantly flipping in and out of the system around one single figure."
  },
  {
    id: 93, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the corporation tax rates for 2026/27?",
    a: "Profits ≤ £50,000: 19% (small profits rate)\nProfits ≥ £250,000: 25% (main rate)\nBetween £50,000–£250,000: marginal relief applies (effective rate up to 26.5% in that band)\n\nThresholds divided by number of ASSOCIATED companies.",
    explain: "Corporation tax is the tax companies pay on their profits, and like income tax, it isn't a single flat rate for everyone.\n\nSmall companies with profits up to £50,000 pay a lower 19% rate, while larger companies with profits of £250,000 or more pay 25%.\n\nProfits in between get a smoothing calculation called marginal relief, so the tax doesn't jump sharply from one rate to the other — and if a person controls several companies together, these thresholds get divided between them to stop the lower rate being claimed multiple times artificially."
  },
  {
    id: 94, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 1", category: "Tax Rule",
    q: "When must most companies pay corporation tax?",
    a: "9 months and 1 DAY after the end of the accounting period.\n\nExample: year end 30 June 2025 → tax due 1 April 2026.\n\nLARGE companies (profits ≥ £1.5m) pay by quarterly instalments.",
    explain: "Most companies get a fairly generous window after their financial year ends to actually pay their corporation tax bill — just over 9 months.\n\nSo a company whose financial year finishes at the end of June has until the following April to settle up.\n\nVery large, profitable companies don't get this luxury though — they have to pay their estimated tax in instalments throughout the year, similar to how self-employed individuals make payments on account."
  },
  {
    id: 95, section: "Section 8", deck: "VAT and Corporation Tax",
    tier: "Tier 2", category: "Common Exam Trap",
    q: "What is the key distinction between zero-rated and exempt VAT supplies?",
    a: "ZERO-RATED: Taxable at 0% — business CAN reclaim input VAT on related purchases.\n\nEXEMPT: NOT taxable — business CANNOT reclaim related input VAT.\n\nThis is crucial: zero-rating is better for the supplier as it preserves input VAT recovery.",
    explain: "These two terms sound similar (both mean \"no VAT charged on the sale\") but have an important practical difference for the business.\n\nA zero-rated sale is technically still within the VAT system, just taxed at 0% — which means the business can still claim back the VAT it paid on its own costs and supplies.\n\nAn exempt sale sits completely outside the VAT system, which sounds similar but actually means the business loses the right to reclaim VAT on related costs — making zero-rating the more favourable status for a business."
  },

  // ══════════════════════════════════════════════════
  // SECTION 9: DIRECT INVESTMENTS
  // ══════════════════════════════════════════════════
  {
    id: 96, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are dividends from UK shares taxed for an individual in 2026/27?",
    a: "First £500: dividend allowance at 0%.\nAbove £500: 10.75% (basic), 35.75% (higher), 39.35% (additional).\n\nDividends are paid GROSS and sit on TOP of non-savings and savings income in the ordering.",
    explain: "This repeats the dividend rules already covered earlier, but in the context of holding shares directly rather than through a fund.\n\nThe first £500 of dividend income each year is always tax-free, no matter your income level.\n\nDividends are added to your income last, after wages and savings interest, which means they're taxed at whatever rate your highest slice of income reaches."
  },
  {
    id: 97, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are gilts taxed for an individual?",
    a: "Interest: taxed as savings income (paid gross).\nCapital gains: EXEMPT from CGT.\nCapital losses: NOT allowable.\n\nGilts are classified as qualifying corporate bonds for CGT purposes.",
    explain: "Gilts are loans to the UK government, which pay you regular interest and can be bought and sold like other investments.\n\nThe interest you receive is taxed normally as savings income, using your Personal Savings Allowance.\n\nHowever, any profit (or loss) from buying and selling the gilt itself is completely outside Capital Gains Tax — it's neither taxed as a gain nor usable as a loss, because gilts sit on the exempt asset list."
  },
  {
    id: 98, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "An investor holds FTSE 100 shares, gilts, and equity unit trusts. Which can produce an allowable CGT loss?",
    a: "Only FTSE 100 shares and equity unit trusts.\n\nGilts are EXEMPT assets — no allowable loss arises. The exemption eliminates both gains AND losses.",
    explain: "This combines two earlier rules into a practical scenario. Ordinary shares and pooled investment funds (unit trusts) are normal Capital Gains Tax assets, so losses on them can be used to offset other gains.\n\nGilts, as established in Card 97, sit completely outside the Capital Gains Tax system — so even if you lose money selling a gilt, that loss simply can't be used for tax purposes at all."
  },
  {
    id: 99, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "How does the mortgage interest restriction work for residential property landlords?",
    a: "Finance costs (mortgage interest etc.) on RESIDENTIAL property are NOT deducted from property income.\n\nInstead: a 20% tax CREDIT applied against income tax liability.\n\nHigher/additional rate taxpayers therefore do NOT get full relief — only a 20% credit, not 40%/45%.",
    explain: "Landlords used to be able to deduct their full mortgage interest from their rental income before working out tax — but for residential properties, this changed.\n\nNow, mortgage interest isn't deducted from rental income at all. Instead, you calculate tax on the full rental income, then get a flat 20% credit based on the interest paid, applied directly to reduce the tax bill.\n\nFor a basic-rate taxpayer this works out roughly the same, but higher and additional-rate landlords lose out, because they only get the relief at 20% instead of their full 40% or 45% tax rate."
  },
  {
    id: 100, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is rent a room relief?",
    a: "If gross receipts from letting a room in the taxpayer's ONLY or MAIN RESIDENCE do not exceed £7,500 → income is EXEMPT.\n\nIf above £7,500: choose (a) normal basis (income minus expenses) or (b) excess over £7,500 with NO expenses.\n\nSplit to £3,750 each if jointly let.",
    explain: "This is a simple incentive for homeowners who rent out a spare room in the house they actually live in, rather than a separate investment property.\n\nIf the rent you collect is £7,500 or less in a year, it's completely tax-free with no paperwork needed.\n\nIf you earn more than that, you can choose between deducting your actual costs as normal, or simply paying tax on everything above £7,500 with no deductions at all — whichever works out cheaper."
  },
  {
    id: 101, section: "Section 9", deck: "Direct Investments — Shares and Property",
    tier: "Tier 2", category: "Tax Rule",
    q: "How are interest distributions from fixed-interest unit trusts taxed?",
    a: "As SAVINGS INCOME (NOT dividends) — paid gross.\n\nRates: 20% basic, 40% higher, 45% additional.\nPSA and starting rate band can be used against them.\n\nContrast with equity unit trusts whose distributions are taxed as dividends.",
    explain: "A unit trust is a pooled fund where many investors' money is combined and professionally managed.\n\nIf the fund mainly holds bonds and similar fixed-interest investments, the payouts it makes to investors are treated as savings income, just like bank interest — using the normal income tax rates and your savings allowances.\n\nThis is different from a fund that mainly holds company shares, where the payouts are instead treated as dividends with their own separate rates."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: INDIRECT INVESTMENTS — ISAs
  // ══════════════════════════════════════════════════
  {
    id: 102, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the ISA annual subscription limit for 2026/27?",
    a: "£20,000 across ALL adult ISAs combined (cash, stocks and shares, Lifetime, innovative finance).\nJunior ISA: £9,000.\nLifetime ISA: £4,000 per year (counts within the £20,000 total).\n\nAll limits frozen until 5 April 2031.",
    explain: "An ISA is a special tax-free wrapper you can put savings or investments inside, and everyone gets an annual limit on how much they can add.\n\nFor adults, that limit is £20,000 a year in total, however you choose to split it across different types of ISA. A separate, smaller limit of £9,000 exists for ISAs opened for children.\n\nOne specific type, the Lifetime ISA, has its own £4,000 cap, but that £4,000 still counts as part of the overall £20,000 adult limit, not on top of it."
  },
  {
    id: 103, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the tax treatment inside an ISA?",
    a: "All income and capital gains are COMPLETELY FREE of tax and need not be declared on a tax return. \n\nAll ISA encashments are free of income tax and CGT.\n\nNO foreign withholding tax can be reclaimed (fund manager reclaims on behalf).",
    explain: "Once money is inside an ISA, it grows completely free of UK tax — no income tax on interest or dividends earned, and no Capital Gains Tax when investments are sold at a profit.\n\nYou don't even need to mention any of this on a tax return, because there's simply nothing to report.\n\nOne small limitation: if the ISA holds overseas investments, any foreign tax deducted at source generally can't be reclaimed by you personally — though the fund manager may handle this on your behalf where possible."
  },
  {
    id: 104, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a 16-year-old open an adult cash ISA?",
    a: "No. Minimum age for ALL adult ISAs is now 18.\n\nAt 16, only a Junior ISA is available (for those born on/after 3 January 2011 without a CTF).",
    explain: "It's a common misconception that 16-year-olds can open adult cash ISAs — this used to be true under older rules, but no longer is.\n\nThe minimum age for every type of adult ISA, including cash ISAs, is now 18.\n\nUntil then, a young person can only have money invested for them through a Junior ISA instead, which works differently and is described in the following cards."
  },
  {
    id: 105, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Does income from a Junior ISA count as the PARENT's income?",
    a: "No. Income from Junior ISAs and CTFs is SPECIFICALLY EXEMPT from the parental settlement rule.\n\nIncome belongs to the child regardless of whether capital came from a parent.",
    explain: "Card 13 explained that interest a parent gives to a child is normally taxed as the parent's own income once it passes £100.\n\nJunior ISAs are a specific, deliberate exception to that rule — money grows completely tax-free inside them and is treated as genuinely belonging to the child, no matter how much the parent originally put in.\n\nThis makes Junior ISAs an effective way for parents to save for a child without triggering the usual anti-avoidance rule."
  },
  {
    id: 106, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the rules for a Lifetime ISA?",
    a: "Available to those aged 18–39.\nAnnual limit: £4,000 (within the £20,000 overall ISA limit).\n25% Government bonus (max £1,000/year) paid until age 50.\nUse for first home purchase (cap £450,000) or retirement from age 60.\nWithdrawal for any other purpose: 25% penalty (effectively losing bonus + some capital).",
    explain: "This is a specific type of ISA designed to help younger adults save either for their first home or for retirement, with a generous government top-up.\n\nFor every £4 you save (up to £4,000 a year), the government adds an extra £1 on top, as long as you're aged 18–39 when you open it.\n\nThe money is meant to stay locked away until you buy your first home or reach age 60 — withdrawing it for any other reason triggers a 25% penalty, which actually claws back more than just the government bonus."
  },
  {
    id: 107, section: "Section 10", deck: "ISAs and Child Trust Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "Can a CTF be transferred to a Junior ISA?",
    a: "Yes. A CTF can be transferred into a Junior ISA. Once transferred, contributions go into the Junior ISA only.\n\nA CTF and Junior ISA CANNOT both have active contributions simultaneously — CTF must be transferred first.",
    explain: "A Child Trust Fund (CTF) was an older type of tax-free children's savings account that existed before Junior ISAs were introduced.\n\nFamilies who still have a CTF can move that money across into a modern Junior ISA, and once they do, all future saving simply goes into the Junior ISA.\n\nYou can't keep contributing to both at the same time — it's one or the other, so the old CTF has to be transferred across first before the Junior ISA can be actively used."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: INDIRECT INVESTMENTS — LIFE ASSURANCE
  // ══════════════════════════════════════════════════
  {
    id: 108, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the 5% withdrawal rule for an onshore life assurance bond?",
    a: "5% of the original premium can be withdrawn per policy year without triggering a chargeable event.\n\nAllowance ACCUMULATES — unused 5% carries forward (e.g. year 3 allows 15% if nothing taken in years 1 & 2).\n\nMaximum cumulative tax-deferred withdrawal: 100% (20 years).",
    explain: "A life assurance bond is an investment where your money grows inside an insurance-based fund, and you only normally pay tax when you take money out in a big way (called a chargeable event).\n\nThis rule lets you take out up to 5% of what you originally put in every year, without triggering any immediate tax assessment at all.\n\nIf you don't use this 5% in a particular year, it doesn't disappear — it builds up and carries forward, so after several years of not withdrawing, you could take out a larger lump sum still tax-deferred."
  },
  {
    id: 109, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Are withdrawals under the 5% rule from a life assurance bond 'tax free'?",
    a: "No — they are TAX DEFERRED, not tax exempt.\n\nThe deferred gain will crystallise at full surrender. The 5% rule simply delays the tax — it does not eliminate it.",
    explain: "It's tempting to think of the 5% withdrawals from Card 108 as completely tax-free, but that's not quite right.\n\nThe tax isn't cancelled — it's simply postponed until later, usually until the bond is eventually fully cashed in.\n\nAt that point, all the growth (including the bits withdrawn along the way) gets added up and assessed for tax together, so the 5% rule is really just a delay rather than a genuine exemption."
  },
  {
    id: 110, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the main chargeable events for a non-qualifying life policy?",
    a: "Death (paying benefit)\nMaturity\nFull surrender\nCertain part surrenders (exceeding cumulative 5% allowance at end of policy year)\nPolicy loans\nAssignment for money or money's worth",
    explain: "A \"chargeable event\" is simply the trigger point where the tax office actually assesses how much tax (if any) is owed on a life assurance bond.\n\nThis can happen when the policyholder dies, when the policy reaches its end date, when it's fully cashed in, or when withdrawals exceed the 5% allowance from Card 108.\n\nA couple of other situations also count: taking a loan against the policy, or selling/transferring it to someone else for payment."
  },
  {
    id: 111, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is a chargeable event gain from an ONSHORE bond taxed?",
    a: "Treated as savings income (highest slice). Added to income.\n\nA 20% BASIC RATE CREDIT is given (life fund has paid tax at 20%).\n\nNet additional tax:\n- Higher-rate taxpayer: 40% − 20% = 20%\n- Additional-rate taxpayer: 45% − 20% = 25%\n- Basic-rate taxpayer: 0% (if gain keeps them basic-rate)",
    explain: "When a chargeable event happens (Card 110) on an onshore bond — one based with a UK insurance company — the gain gets added to your income for tax purposes.\n\nBecause the insurance company has already effectively paid 20% tax inside the fund as it grew, you're given a 20% credit, meaning you only owe the extra amount to reach your own personal tax rate.\n\nFor a basic-rate taxpayer this often means no extra tax at all, while higher and additional-rate taxpayers still owe a top-up of 20% or 25% respectively."
  },
  {
    id: 112, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Principle",
    q: "What is the PURPOSE of top-slicing relief for life assurance bonds?",
    a: "To prevent a large gain pushing the taxpayer into a higher rate band simply because the gain has accumulated over many years.\n\nThe gain is divided by N (number of complete policy years) to find the 'annual equivalent,' which is used to determine the RATE of tax — then that rate is applied to the FULL gain.",
    explain: "If a bond grows steadily for, say, 10 years and is then cashed in all at once, the entire gain lands in a single tax year — which could unfairly push someone into a higher tax bracket, even though the growth actually happened gradually over a decade.\n\nTop-slicing relief corrects for this by mentally \"spreading\" the gain back over the years it built up, just to work out which tax rate should apply — as if it had been taxed a little each year instead of all at once.\n\nOnce the correct rate is identified this way, it's then applied to the whole gain, giving a fairer result than if the full lump sum had been judged against just one year's tax bands."
  },
  {
    id: 113, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Calculation",
    q: "What are the 5 steps to calculate top-slicing relief?",
    a: "Step 1: Calculate tax on FULL gain (with other income). Deduct 20% basic rate credit → Step 2 liability.\nStep 2: Annual equivalent = gain ÷ N complete years.\nStep 3: Calculate tax on annual equivalent. Deduct 20% credit. Multiply result × N → 'Relieved liability.'\nStep 4: Top-slicing relief = Step 2 liability − Relieved liability.\nStep 5: Tax payable = Total year's tax − top-slicing relief.",
    explain: "This is the mechanical version of the idea explained in Card 112.\n\nFirst, work out the tax as if the whole gain landed in one year (giving a likely-too-high figure). Then, work out what the tax would be if just one year's worth (the gain divided by the number of years held) was taxed instead, and multiply that smaller tax figure back up by the number of years.\n\nThe difference between these two figures is the actual relief given — it's subtracted from the \"all at once\" tax bill to arrive at the fairer final amount owed."
  },
  {
    id: 114, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A basic-rate taxpayer surrenders an onshore bond with a gain. When does additional income tax arise?",
    a: "ONLY if the gain, when added to other income, pushes income into the HIGHER rate band.\n\nIf they remain a basic-rate taxpayer throughout (including with the gain), NO additional tax is due — the 20% has already been paid by the life company.",
    explain: "Because of the 20% credit explained in Card 111, a basic-rate taxpayer often owes nothing extra at all when cashing in an onshore bond.\n\nThe only time additional tax becomes due is if adding the bond gain on top of their other income actually tips them over into the higher-rate tax band.\n\nIf their total income, gain included, still stays within the basic-rate band, the 20% already paid inside the fund fully covers what they owe."
  },
  {
    id: 115, section: "Section 10", deck: "Life Assurance Bonds — Onshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Where does a life assurance chargeable event gain sit in the income ordering?",
    a: "LAST — it is always treated as the HIGHEST PART of income, above savings income and dividends.\n\nThis can push other income into higher bands and reduce the personal savings allowance available.",
    explain: "This connects back to the very first card in this deck about income ordering.\n\nA bond gain is always stacked right at the top of all your other income, above everyday earnings, savings interest, and even dividends.\n\nBecause it sits at the very top, it can have knock-on effects elsewhere — for example, by pushing your total income high enough to reduce or remove your Personal Savings Allowance on the interest you earned earlier in the stack."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: OFFSHORE BONDS
  // ══════════════════════════════════════════════════
  {
    id: 116, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Comparison",
    q: "What is the KEY tax difference between onshore and offshore bonds?",
    a: "ONSHORE: 20% basic rate treated as paid (life fund has paid tax). Net tax: higher-rate = 20%; additional-rate = 25%.\n\nOFFSHORE: No basic rate credit (gross roll-up). Full rates apply: basic = 20%; higher = 40%; additional = 45%.",
    explain: "A bond is an investment where your money grows inside a fund, and you only pay tax when you take money out, not every year.\n\nWith an onshore bond, the fund itself has already paid 20% tax on its growth before you even withdraw anything, so when you cash in, you're given credit for that and only pay the extra to reach your own rate.\n\nAn offshore bond uses \"gross roll-up,\" meaning the fund pays no tax at all while growing — \"gross\" means before any tax is taken off. Because nothing was paid along the way, you owe tax on the entire gain at your full rate when you finally withdraw, with no credit."
  },
  {
    id: 117, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Why might an additional-rate taxpayer still choose an ONSHORE bond over an offshore bond?",
    a: "Onshore: 20% in fund + 25% on gain = 40% effective rate on the gross return.\nOffshore: 45% on the gross gain.\n\nThe onshore bond gives a LOWER effective tax rate at surrender, despite the fund-level tax.\n\nHowever, the offshore bond's GROSS ROLL-UP can outperform long-term due to compounding.",
    explain: "On paper, an offshore bond's growth sounds better because nothing is taxed along the way — but the eventual tax bill at the end can actually be higher overall.\n\nFor an additional-rate taxpayer, the onshore bond's combined tax burden (20% already paid inside the fund, plus 25% more on cashing in) works out to roughly 40% total — lower than the offshore bond's full 45% rate charged all at once.\n\nThat said, the offshore bond's tax-free growth along the way can sometimes make up the difference over a long enough time, due to compounding returns on the money that wasn't taxed yearly."
  },
  {
    id: 118, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is time apportionment relief for an offshore bond?",
    a: "Where the policyholder was non-UK resident during part of the policy, the gain is reduced by:\n\n(Days NOT resident ÷ Total days policy held) × gain\n\nIf resident outside UK for entire term: gain = nil.",
    explain: "If someone held an offshore bond while living outside the UK for part of the time, it wouldn't be fair to tax the UK on growth that happened while they weren't even a UK taxpayer.\n\nThis relief reduces the taxable gain in proportion to how much of the bond's life was spent while non-UK resident.\n\nIf the entire policy was held while living abroad, the whole gain ends up tax-free in the UK."
  },
  {
    id: 119, section: "Section 10", deck: "Life Assurance Bonds — Offshore",
    tier: "Tier 1", category: "Tax Rule",
    q: "When is a chargeable event gain on a bond held in trust taxed on the settlor vs the trustees?",
    a: "Chargeable on SETTLOR: if alive and UK tax resident at time of chargeable event.\n\nChargeable on TRUSTEES (at 45%): if settlor is dead or non-UK resident.\n\nChargeable on BENEFICIARIES: if trustees are non-UK resident, UK-resident beneficiaries are taxed as they receive benefits.",
    explain: "If a life assurance bond is held inside a trust rather than owned directly, working out who actually pays the tax depends on the circumstances.\n\nIf the person who originally set up the trust (the settlor) is still alive and UK resident, it's normally taxed on them personally.\n\nIf the settlor has died or isn't UK resident, the tax instead falls on the trustees at a high 45% rate — unless the trustees themselves are non-UK resident, in which case it shifts again to UK-resident beneficiaries as and when they actually receive money from the trust."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: EIS, SEIS, VCT
  // ══════════════════════════════════════════════════
  {
    id: 120, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for an EIS investment?",
    a: "Income tax relief: 30% (max £1m; £2m for knowledge-intensive companies)\nCGT exemption: gains exempt if held 3+ years and IT relief not withdrawn\nCGT deferral: any gain reinvested within 1yr before/3yrs after can be deferred — no upper limit\nIHT: 100% business relief after 2 years\nLoss relief: allowable after netting off IT relief received",
    explain: "EIS stands for Enterprise Investment Scheme — a government scheme encouraging people to invest in small, higher-risk UK companies, in exchange for generous tax breaks.\n\nYou get 30% of your investment back as a direct reduction in your income tax bill, and if you hold the shares for at least 3 years, any profit when you sell is completely free of Capital Gains Tax.\n\nYou can also defer tax on a completely separate gain (from selling something else entirely) by reinvesting it into EIS shares, and after 2 years the shares become free of Inheritance Tax too — reflecting how risky and illiquid these investments tend to be."
  },
  {
    id: 121, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for a SEIS investment?",
    a: "Income tax relief: 50% (max £200,000 per year)\nCGT: 50% EXEMPTION on gains reinvested in SEIS in same or following year (carried back)\nLoss relief: available (net of IT relief)\n\nKey difference from EIS: no CGT deferral — gain is partly exempt (50%), not deferred.",
    explain: "SEIS stands for Seed Enterprise Investment Scheme — similar to EIS but aimed at even earlier-stage, smaller startups, which is why the tax incentives are even more generous.\n\nYou get 50% of your investment back directly off your income tax bill, an even bigger relief than EIS offers.\n\nThe Capital Gains Tax treatment works slightly differently too: instead of deferring tax on another gain entirely, SEIS simply makes 50% of that other gain permanently exempt, as long as you reinvest it into SEIS shares."
  },
  {
    id: 122, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the tax reliefs for a VCT investment?",
    a: "Income tax relief: 30% (max £200,000 in newly issued shares; withdrawn if sold within 5 years)\nDividends: tax FREE (up to £200,000 invested per year)\nCGT: gains EXEMPT (no minimum holding period)\nCGT deferral: NOT available\nIHT: VCT shares do NOT qualify for business relief",
    explain: "A VCT (Venture Capital Trust) is a listed company that itself invests in a spread of smaller companies, giving investors a more diversified way to access similar tax breaks to EIS/SEIS.\n\nLike EIS, you get 30% of your investment back via income tax relief, and any dividends or gains from the VCT shares are completely tax-free.\n\nUnlike EIS, there's no minimum holding period for the Capital Gains Tax exemption, no ability to defer other gains into a VCT, and VCT shares don't qualify for any Inheritance Tax relief."
  },
  {
    id: 123, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Can a VCT investor defer a capital gain by reinvesting in VCT shares?",
    a: "No. CGT DEFERRAL relief is NOT available for VCTs.\n\nDeferral is available for EIS only. VCTs offer CGT EXEMPTION on gains from VCT shares themselves — but cannot shelter gains from other assets.",
    explain: "This trap tests the difference flagged in Card 122.\n\nVCTs let you avoid tax on gains made from the VCT shares themselves, but they cannot be used as a vehicle to shelter a completely separate gain (like selling a house) the way EIS can.\n\nIf someone wants to defer tax on an unrelated gain by reinvesting, only EIS offers that option — VCT and SEIS work differently, as shown in Cards 120–121."
  },
  {
    id: 124, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Comparison",
    q: "Compare income tax relief rates: EIS vs SEIS vs VCT.",
    a: "EIS: 30% relief — max investment £1m (£2m knowledge-intensive)\nSEIS: 50% relief — max investment £200,000\nVCT: 30% relief — max investment £200,000 (newly issued shares only)\n\nSEIS has the highest relief rate (50%). EIS has the largest maximum investment.",
    explain: "These three schemes are easy to mix up, so it helps to compare them side by side.\n\nSEIS gives the biggest percentage relief (50%) because it targets the very earliest, riskiest startups, but caps how much you can invest at a relatively low £200,000 a year.\n\nEIS gives a lower percentage (30%) but allows a much bigger investment (up to £1m or £2m), while VCT also gives 30% relief but with the same lower £200,000 cap as SEIS."
  },
  {
    id: 125, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Do VCT shares qualify for IHT business relief?",
    a: "No. VCT shares are NOT qualifying business property for IHT purposes.\n\nContrast: EIS and SEIS shares DO qualify for 100% business relief after 2 years of ownership.",
    explain: "Although VCT, EIS and SEIS all offer similarly generous income tax and Capital Gains Tax breaks, they don't all get the same Inheritance Tax treatment.\n\nEIS and SEIS shares can become completely free of Inheritance Tax after 2 years, because business relief applies to them.\n\nVCT shares are different — they're shares in a fund-like investment trust rather than a direct stake in a trading business, so they don't qualify for this particular relief at all."
  },
  {
    id: 126, section: "Section 10", deck: "EIS, SEIS and Venture Capital Trusts",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "If an EIS investor holds shares for 3+ years and the company qualifies throughout, is the gain always CGT-exempt?",
    a: "Only if INCOME TAX RELIEF was given and NOT subsequently withdrawn.\n\nIf income tax relief has been clawed back, the CGT exemption is also lost.",
    explain: "The Capital Gains Tax exemption for EIS investments isn't automatic just from holding the shares for long enough — it depends on the income tax relief from Card 120 actually having been claimed and kept.\n\nIf that income tax relief was withdrawn for some reason — perhaps the rules were breached, or the company stopped qualifying too early — the linked Capital Gains Tax exemption is withdrawn as well.\n\nThe two reliefs are connected, not independent of each other."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: REITs
  // ══════════════════════════════════════════════════
  {
    id: 127, section: "Section 10", deck: "REITs and Property Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are REIT distributions taxed for individual investors?",
    a: "Two types:\n1. Property income distribution (PID) from tax-exempt element: treated as property income; paid net of 20% tax. Additional tax for higher/additional rate taxpayers.\n\n2. Non-PID dividend from non-exempt element: taxed as ordinary dividend (10.75%/35.75%/39.35%) with £500 dividend allowance.\n\nCGT on gains from REIT share disposals — ordinary share rules.",
    explain: "A REIT (Real Estate Investment Trust) is a company that owns and manages property, letting ordinary investors buy shares in a property portfolio without buying a building themselves.\n\nBecause REITs get special tax treatment on their rental profits, the payouts they make to investors are split into two different types: one taxed like rental income (with 20% already deducted), and a smaller portion taxed like an ordinary company dividend.\n\nIf you sell your REIT shares at a profit, that's taxed under the normal Capital Gains Tax rules, just like selling any other company's shares."
  },
  {
    id: 128, section: "Section 10", deck: "REITs and Property Funds",
    tier: "Tier 1", category: "Tax Rule",
    q: "What structure must a REIT have?",
    a: "UK-resident, CLOSED-ENDED company listed on a recognised stock exchange.\nMust distribute 90%+ of rental profits within 12 months.\n75%+ of gross profits from property letting.\nInterest coverage ratio 125%+.",
    explain: "To qualify for the special REIT tax status described in Card 127, a company has to meet several strict conditions.\n\nIt must be a UK company listed on a recognised stock exchange, and the vast majority of its profits (75%+) must come from genuinely letting out property, not other activities.\n\nIn exchange for these tax advantages, the company is also required to pay out almost all of its rental profits (90%+) to shareholders fairly quickly, rather than keeping the cash inside the company."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: PENSIONS
  // ══════════════════════════════════════════════════
  {
    id: 129, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the pension annual allowance for 2026/27?",
    a: "£60,000 (combined employer + employee contributions).\n\nTapered to minimum £10,000 for those with 'adjusted income' (including employer contributions) exceeding £260,000 — at rate of £1 per £2 over £260,000.\n\nUnused allowance carries forward up to 3 years.",
    explain: "There's a yearly cap on how much can be paid into your pension (from any source, including your employer) while still getting tax relief on it.\n\nFor most people, this cap is £60,000 a year, but it shrinks for very high earners, down to as little as £10,000 for those with very large total income.\n\nIf you didn't use your full allowance in previous years, you can carry the unused amount forward for up to 3 years, letting you make a larger contribution in a single year if needed."
  },
  {
    id: 130, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is an Uncrystallised Fund Pension Lump Sum (UFPLS)?",
    a: "A withdrawal from an uncrystallised pension fund where:\n25% of EACH withdrawal is paid TAX FREE\n75% is taxable as income in the year of withdrawal\n\nTriggers the MPAA (£10,000) after the first UFPLS.",
    explain: "This is one way of taking money directly out of a pension that hasn't been touched yet (\"uncrystallised\" simply means not yet accessed).\n\nEach time you take a UFPLS withdrawal, a quarter of it comes out completely tax-free, while the remaining three-quarters is taxed as normal income in that year.\n\nOnce you take your first UFPLS payment, it restricts how much you can contribute to a pension again in future, under a rule called the MPAA, covered in a later card."
  },
  {
    id: 131, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the maximum pension commencement lump sum (PCLS)?",
    a: "25% of the pension fund being crystallised, subject to the LUMP SUM ALLOWANCE of £268,275.\n\nTaking a PCLS alone does NOT trigger the MPAA (unlike drawdown or UFPLS).",
    explain: "This is the more traditional way people think of \"tax-free cash\" from a pension — taking a single lump sum upfront when you start drawing your pension, rather than the per-withdrawal approach of UFPLS.\n\nYou can normally take 25% of your pension pot tax-free this way, but there's an overall cap on how large that tax-free lump sum can be across your whole life, currently £268,275.\n\nImportantly, simply taking this lump sum on its own doesn't restrict your ability to keep contributing to pensions afterwards, unlike some other ways of accessing pension money."
  },
  {
    id: 132, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "What is the Money Purchase Annual Allowance (MPAA)?",
    a: "£10,000. Applies once a pension fund is accessed FLEXIBLY (drawdown, UFPLS).\n\nLimits future defined contribution pension contributions.\n\nTaking ONLY a PCLS does NOT trigger the MPAA.",
    explain: "Once you start taking taxable income out of your pension flexibly — through drawdown or a UFPLS withdrawal — the rules restrict how much you can put back in afterwards, to stop people recycling money through a pension purely to generate extra tax relief.\n\nAfter this is triggered, your normal £60,000 annual allowance (Card 129) drops sharply to just £10,000.\n\nSimply taking your tax-free lump sum alone (Card 131) doesn't trigger this restriction — it's only triggered once you actually start taking taxable pension income."
  },
  {
    id: 133, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Is pension income subject to National Insurance Contributions?",
    a: "No. Pension income is subject to INCOME TAX (via PAYE) but NOT to any class of NICs.\n\nThis is a straightforward but commonly confused point.",
    explain: "When you draw an income from your pension in retirement, it's taxed just like normal earnings for income tax purposes, deducted automatically through the PAYE system.\n\nHowever, National Insurance is specifically designed as a tax on working-age earnings, so pension income is never subject to it, regardless of how it's drawn.\n\nThis can surprise people expecting pension income to be treated identically to a salary in every respect."
  },
  {
    id: 134, section: "Section 10", deck: "Pensions",
    tier: "Tier 1", category: "Tax Rule",
    q: "How are pension death benefits taxed based on the member's age at death?",
    a: "Under 75: lump sums within LSDBA (£1,073,100) are TAX FREE. Annuity/drawdown also tax free. Excess lump sums: taxable as recipient's income.\n\nAt 75 or over: ALL death benefits (whether annuity, drawdown or lump sum) are taxable as INCOME in the hands of the recipient.",
    explain: "What happens to a pension when someone dies depends heavily on how old they were at the time.\n\nIf they die before age 75, the money passed on to beneficiaries is generally completely tax-free, up to a very high overall limit — whether paid as a lump sum, an ongoing income, or left in drawdown.\n\nIf they die at 75 or older, the tax-free treatment disappears, and whoever receives the pension money has to pay income tax on it, just as if it were their own pension income."
  },

  // ══════════════════════════════════════════════════
  // SECTION 10: PURCHASED LIFE ANNUITIES
  // ══════════════════════════════════════════════════
  {
    id: 135, section: "Section 10", deck: "Annuities",
    tier: "Tier 1", category: "Tax Rule",
    q: "How is a purchased life annuity (PLA) taxed?",
    a: "Split into:\n(a) Capital element — treated as return of original capital; NOT taxable\n(b) Interest element — taxable as SAVINGS INCOME; tax deducted at source at 20%\n\nCapital element fixed at outset based on purchase price and HMRC mortality tables.",
    explain: "A purchased life annuity is something you buy with your own savings (not pension money) in exchange for a guaranteed regular income for life.\n\nBecause part of each payment is simply your own original money being handed back to you, that portion isn't taxed at all — it's treated as a return of capital, not income.\n\nOnly the remaining portion, which represents genuine investment growth/interest, is taxed as savings income, with some tax already taken off before you receive it."
  },
  {
    id: 136, section: "Section 10", deck: "Annuities",
    tier: "Tier 1", category: "Comparison",
    q: "How does the taxation of a purchased life annuity differ from a pension annuity?",
    a: "PLA: Partly tax free (capital return) + interest element taxed as savings income at 0/20/40/45%.\n\nPENSION ANNUITY: FULLY taxable as earned income via PAYE at marginal rate. No tax-free element (tax-free cash was separate at crystallisation).",
    explain: "These two types of annuity sound similar but are taxed very differently.\n\nA purchased life annuity (Card 135) is bought with your own already-taxed savings, so part of each payment is tax-free, as explained above.\n\nA pension annuity, by contrast, is bought using pension money that hasn't been taxed yet (any tax-free cash was already taken separately beforehand) — so every single payment from a pension annuity is fully taxable as income, with no tax-free portion built in."
  },

  // ══════════════════════════════════════════════════
  // SECTION 11: TRUST INCOME TAX
  // ══════════════════════════════════════════════════
  {
    id: 137, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates for a UK discretionary (relevant property) trust?",
    a: "Dividends: 39.35%\nAll other income (interest, rent): 45%\n\nTrustees do NOT get: personal savings allowance, dividend allowance, or personal allowance.\n\nSpecial allowance: income below £500 may be exempt (but split if multiple trusts by same settlor).",
    explain: "A discretionary trust is one where the trustees decide how and when to give money to beneficiaries, rather than it being automatically owed to a named person.\n\nBecause this gives flexibility that could otherwise be used to avoid tax, these trusts are taxed at high flat rates — 45% on most income, slightly less (39.35%) on dividends.\n\nUnlike individuals, trustees don't get any of the normal personal allowances — no tax-free slice, no savings allowance, no dividend allowance — only a small separate exemption if total income is very low."
  },
  {
    id: 138, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "What are the income tax rates for an interest in possession (IIP) trust?",
    a: "Dividends: 10.75%\nAll other income: 20%\n\nTrustees do NOT get personal savings allowance or dividend allowance.\n\nBeneficiary includes the trust income in their own return and claims a credit for trustee's tax. Higher/additional rate taxpayers pay the difference.",
    explain: "An interest in possession trust works differently from the discretionary trust in Card 137 — here, a specific named beneficiary has an automatic right to the trust's income as it arises.\n\nBecause there's no flexibility for trustees to redirect the money elsewhere, this type of trust is taxed at much lower rates, similar to a basic-rate individual.\n\nThe beneficiary then includes this income on their own tax return too, getting credit for the tax the trustees already paid — if the beneficiary is a higher-rate taxpayer, they simply pay the extra difference themselves."
  },
  {
    id: 139, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "A discretionary trust receives dividend income. Can the trustees use the £500 dividend allowance?",
    a: "No. Trustees of discretionary trusts are NOT entitled to the dividend allowance.\n\nAll dividend income is taxed at 39.35%. The £500 income exemption is a SEPARATE concept — it only applies where total trust income is below £500.",
    explain: "This tests a detail from Card 137 directly: trustees don't get the normal £500 tax-free dividend allowance that individuals enjoy.\n\nEvery pound of dividend income received by a discretionary trust is taxed at 39.35%, with no tax-free slice at all.\n\nThe small £500 exemption mentioned for trusts is a completely different, narrower rule — it only matters if the trust's total income for the year is under £500 altogether, not as a per-dividend allowance."
  },
  {
    id: 140, section: "Section 11", deck: "Trust Taxation",
    tier: "Tier 1", category: "Tax Rule",
    q: "When a discretionary trust distributes income to a beneficiary, what tax credit is attached?",
    a: "ALL distributions carry a 45% TAX CREDIT regardless of the type of income that was originally received.\n\nIf trustees paid only 39.35% on dividends, they must pay the DIFFERENCE to HMRC before distributing.\n\nBasic-rate beneficiaries can reclaim the excess (45% − 20% = 25% repayable).",
    explain: "When money is eventually paid out from a discretionary trust to a beneficiary, it's always treated as if 45% tax had already been paid on it, regardless of whether it originally came from dividends (taxed at the lower 39.35%) or other income (already taxed at 45%).\n\nIf the trustees had only paid the lower dividend rate, they have to top this up to the full 45% before paying the beneficiary, so the beneficiary always receives money carrying this 45% credit.\n\nA basic-rate beneficiary who only actually owes 20% tax can then reclaim the difference (25%) back from the tax office."
  },

  // ══════════════════════════════════════════════════
  // SECTION 12: TAX PLANNING & COMPUTATIONS
  // ══════════════════════════════════════════════════
  {
    id: 141, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Process",
    q: "In what order must the income tax computation steps be performed?",
    a: "Step 1: Total income (add all sources)\nStep 2: Deduct reliefs from income (e.g. loss relief, qualifying interest)\nStep 3: Deduct personal allowance → amount on which tax is calculated\nStep 4: Extend bands for pension (net) and gift aid (gross)\nStep 5: Calculate tax — non-savings → savings → dividends → life assurance gains\nStep 6: Deduct tax reducers (marriage allowance, married couple's allowance)",
    explain: "This pulls together everything covered earlier into one structured process for working out someone's total income tax.\n\nYou start by adding up all income, then subtract any reliefs and your personal allowance, before stretching your tax bands for pension or gift aid contributions.\n\nTax is then calculated following the strict ordering from Card 1 (everyday income, then savings, then dividends, then bond gains), with any final tax-reducing allowances like the marriage allowance applied right at the end."
  },
  {
    id: 142, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "In what order do a life assurance bond gain and a CGT disposal sit in the income calculation?",
    a: "The TOP-SLICED bond gain is used when calculating the BASIC RATE BAND remaining for CGT purposes.\n\nOrdering: income → top-sliced bond gain (to fix CGT rates) → full bond gain → CGT disposal\n\nSo the top-sliced gain precedes the full CGT gain in rate determination.",
    explain: "This restates the same trap flagged in Card 36, but ties it together with the income tax ordering rules from Card 1.\n\nWhen someone has both a bond gain and a separate capital gain in the same year, the bond's top-sliced figure is used first to see how much basic-rate band is left over for working out the Capital Gains Tax rate.\n\nThis sequencing genuinely matters for the final tax bill, and is one of the more easily confused calculation orders in the syllabus."
  },
  {
    id: 143, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "Sophie transfers shares to her husband Stanley for immediate disposal. When and on whom does CGT arise?",
    a: "CGT arises on STANLEY'S DISPOSAL — not on the transfer to Stanley (which is no gain/no loss).\n\nTax is assessed at STANLEY'S rates, on the gain calculated from SOPHIE'S original base cost.\n\nStanley uses HIS OWN annual exempt amount and unused basic rate band.",
    explain: "This applies the spousal transfer rule from Card 38 to a concrete scenario.\n\nWhen Sophie gives the shares to Stanley, that transfer itself triggers no tax at all, as covered earlier.\n\nThe actual taxable event only happens when Stanley sells the shares onward — and it's Stanley's own tax rate, his own tax-free allowance, and his own available basic-rate band that get used, even though Sophie originally bought the shares and effectively orchestrated the sale."
  },
  {
    id: 144, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Comparison",
    q: "For a higher-rate taxpayer, which is more tax efficient — a reporting offshore fund or a non-reporting offshore fund?",
    a: "REPORTING FUND: gains taxed at 18%/24% CGT rates. Generally more efficient.\n\nNON-REPORTING FUND: the entire gain (income + capital) is taxed as INCOME at 40%/45%.\n\nFor higher-rate taxpayers, reporting funds are generally more tax efficient due to lower CGT rates.",
    explain: "Offshore investment funds come in two flavours based on whether they follow UK reporting rules.\n\nA \"reporting\" fund keeps the tax office regularly informed about its income, and in return, any profit you make selling it is taxed under the normal, lower Capital Gains Tax rates.\n\nA \"non-reporting\" fund doesn't provide this transparency, so as a penalty, your entire profit gets taxed as income at the much higher income tax rates instead — making reporting funds significantly more tax-efficient for most investors."
  },
  {
    id: 145, section: "Section 12", deck: "Tax Planning and Computations",
    tier: "Tier 1", category: "Process",
    q: "What options does a client with a personal pension aged 62 have to access funds for the first time?",
    a: "1. CRYSTALLISE — take 25% PCLS tax free + flexi-access drawdown (taxable income)\n2. UFPLS — each withdrawal 25% tax free/75% taxable; triggers MPAA after first payment\n3. CRYSTALLISE then purchase annuity (fully taxable as income)\n\nKey considerations: tax rate, income needs, death benefits, MPAA triggering.",
    explain: "This brings together the pension access methods covered in Cards 130–132 into a single practical decision someone might actually face.\n\nThey could take a traditional tax-free lump sum and leave the rest invested in drawdown, take flexible UFPLS withdrawals as needed, or use the money to buy a guaranteed income (an annuity) instead.\n\nThe right choice depends on things like their tax position, how much income they actually need, what happens to the money when they die, and whether triggering the lower MPAA contribution limit matters to them."
  },

  // ══════════════════════════════════════════════════
  // R03 EXAM TRAPS DECK (standalone)
  // ══════════════════════════════════════════════════
  {
    id: 146, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Is the Personal Savings Allowance available to additional-rate taxpayers?",
    a: "No. The PSA is NIL for additional-rate taxpayers.\n\nOnly basic-rate taxpayers get £1,000 and higher-rate taxpayers get £500.\n\nMany candidates incorrectly apply the PSA to all taxpayers.",
    explain: "This repeats the rule from Card 4, but flagged specifically as a common exam mistake.\n\nIt's easy to assume everyone gets some savings allowance, but additional-rate taxpayers get absolutely none — their savings interest is taxed in full from the very first pound."
  },
  {
    id: 147, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can the CGT annual exempt amount be carried forward if unused?",
    a: "No. The £3,000 AEA is PERMANENTLY LOST if not used in the tax year.\n\nOnly capital LOSSES carry forward. The annual exempt amount does not.",
    explain: "This is the trap version of Card 37's rule — it's easy to confuse with the rule that capital losses DO carry forward.\n\nThe tax-free allowance itself is strictly use-it-or-lose-it each year, with no exceptions, unlike actual losses which can be saved for future years."
  },
  {
    id: 148, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does IHT taper relief reduce the size of the gift in the 7-year cumulation?",
    a: "No. Taper relief reduces the TAX PAYABLE on the gift — NOT the value used in cumulation.\n\nThe FULL GIFT VALUE still erodes the nil rate band for future transfers and the death estate.",
    explain: "This is the trap version of Cards 58–59. Taper relief feels like it should shrink the gift, since it shrinks the tax bill, but it doesn't.\n\nThe original full value still gets used when checking how much tax-free allowance remains for everything else."
  },
  {
    id: 149, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can the IHT RNRB be set against a PET or CLT?",
    a: "No. The RNRB applies ONLY against the death estate.\n\nIt cannot be used against lifetime transfers, even if they become chargeable on death.",
    explain: "This restates Card 71's rule, flagged as a trap because candidates sometimes assume the home allowance works the same way as the main nil rate band.\n\nIt's narrower — it only ever applies to what's actually in the estate at death."
  },
  {
    id: 150, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can losses from a disposal to a connected person be set against other gains?",
    a: "No. These 'clogged losses' can ONLY be set against gains from the SAME connected person.\n\nThey cannot offset other capital gains — unlike ordinary losses.",
    explain: "This restates Card 52's rule. A normal capital loss can be used against any gain, but a loss made dealing with a close relative or controlled company is restricted — it can only ever offset future gains from that exact same person."
  },
  {
    id: 151, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A person has income of £102,000. What is the effective tax rate on the MARGINAL £1 earned?",
    a: "60%. Between £100,000–£125,140, the personal allowance is withdrawn at £1 per £2 of income.\n\nSo earning an extra £2 costs: £0.80 higher rate tax + £0.40 tax on lost allowance = £1.20 → 60% effective rate.",
    explain: "This is the same 60% trap explained fully in Card 9, applied to a specific number.\n\nAnyone with income in this £100,000–£125,140 band faces this hidden extra tax, which often surprises candidates who only think about the standard 40% rate."
  },
  {
    id: 152, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: The 5% withdrawal rule applies to onshore bonds only. True or false?",
    a: "FALSE. The 5% tax-deferred withdrawal rule applies to BOTH onshore AND offshore bonds.\n\nThe difference is the tax treatment at the chargeable event: onshore gets a 20% credit; offshore does not.",
    explain: "Candidates often wrongly assume the 5% withdrawal allowance (Card 108) is unique to onshore bonds, perhaps because the rest of onshore/offshore taxation differs so much.\n\nIn fact, both types of bond share this exact same withdrawal rule — it's only what happens at full cash-in that differs."
  },
  {
    id: 153, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A self-employed person's profits are £30,000. Do they pay Class 2 NICs?",
    a: "No actual payment. Class 2 NICs are DEEMED PAID automatically when profits are at or above £7,105.\n\nNo cash payment required. The small profits threshold only matters for those BELOW £7,105 who might voluntarily pay to protect benefits.",
    explain: "This restates Card 29's rule as a trap, because it's counter-intuitive that someone could be \"paying\" something without any money actually changing hands.\n\nAbove the small profits threshold, the protection is simply automatic and free."
  },
  {
    id: 154, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Is a pension commencement lump sum always 25% of the entire pension fund?",
    a: "No. 25% of the PENSION FUND BEING CRYSTALLISED, subject to the Lump Sum Allowance of £268,275.\n\nIf the pension fund is very large, 25% may exceed £268,275 — the excess PCLS is taxed as income.",
    explain: "This restates Card 131's cap, flagged because candidates often forget the overall ceiling exists.\n\nFor very large pension pots, the 25% figure simply stops applying once it would exceed £268,275 in total — anything beyond that gets taxed instead of paid tax-free."
  },
  {
    id: 155, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A person dies leaving £200,000 to spouse and £400,000 to children. NRB is £325,000. What IHT is due?",
    a: "£30,000. Spouse exemption removes £200,000 from IHT. Only £400,000 passes to children. NRB covers £325,000 → £75,000 taxable at 40% = £30,000.\n\nDo NOT apply the NRB to the entire estate before deducting exemptions.",
    explain: "This is a calculation trap: the temptation is to apply the £325,000 tax-free allowance to the whole £600,000 estate first.\n\nBut the spouse exemption (Card 61) removes the £200,000 going to the spouse from the calculation entirely before the allowance is even applied, leaving only the £400,000 going to the children to be tested against the nil rate band."
  },
  {
    id: 156, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: When CGT current-year losses are set against gains, must they reduce gains below the annual exempt amount?",
    a: "YES — current-year losses MUST be set against gains first, EVEN IF this wastes the annual exempt amount.\n\nOnly BROUGHT-FORWARD losses can be restricted to stop the net gain falling below the AEA.",
    explain: "This restates Card 42's rule, flagging the trap precisely.\n\nThere's no choice involved with current-year losses — they're forced to offset gains first, even if it means the tax-free allowance goes unused that year. Only losses carried forward from earlier years give you flexibility to avoid wasting the allowance."
  },
  {
    id: 157, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A non-reporting offshore fund investor dies. Is the gain triggered?",
    a: "Yes. Death is treated as a DISPOSAL for non-reporting funds, triggering an OFFSHORE INCOME GAIN taxable as income at the date of death.\n\nThis is different from reporting funds where death is not a disposal.",
    explain: "This is a specific, easily-missed rule about non-reporting funds (covered generally in Card 144).\n\nNormally, death isn't treated as selling your assets for Capital Gains Tax purposes — but for this specific type of offshore fund, death IS treated as a sale, triggering an immediate tax charge on the estate."
  },
  {
    id: 158, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A higher-rate taxpayer receives a REIT property income distribution (PID). Is it taxed as dividend income?",
    a: "No. PIDs are treated as PROPERTY INCOME, not dividend income.\n\nPaid net of 20% tax. Higher-rate taxpayers pay a FURTHER 20% (total 40%). The dividend allowance does NOT apply.\n\nContrast: non-PID dividends from REITs are taxed as ordinary dividends.",
    explain: "This restates the two-part REIT taxation from Card 127, flagging the trap directly.\n\nIt's tempting to assume all REIT payouts are dividends since they come from a company, but the main \"property income distribution\" portion is specifically taxed as rental income instead, with no dividend allowance available against it."
  },
  {
    id: 159, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does claiming under the FIG regime affect the personal allowance?",
    a: "Yes — making ANY FIG claim (even just for foreign gains) results in the loss of BOTH:\n- The personal allowance, AND\n- The CGT annual exempt amount\n\nfor that tax year.",
    explain: "This restates Card 78's trade-off as a trap, because candidates sometimes think the FIG regime is simply a bonus with no downside.\n\nClaiming it always costs you both your personal allowance and your CGT exemption for that year, even if you only needed the relief for a small amount of foreign income."
  },
  {
    id: 160, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: A purchased life annuity is fully taxable as income. True or false?",
    a: "FALSE. A PLA has:\n(a) CAPITAL ELEMENT — non-taxable (return of original capital)\n(b) INTEREST ELEMENT — taxable as savings income\n\nContrast: a PENSION ANNUITY is FULLY taxable as earned income (no tax-free element).",
    explain: "This restates the comparison from Cards 135–136, flagged as a trap because the two types of annuity are easy to confuse.\n\nOnly a pension annuity is fully taxable — a purchased life annuity bought with your own savings always has a genuinely tax-free portion built in."
  },
  {
    id: 161, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: For SDLT, the 5% additional property surcharge applies only when the buyer owns more than one property at the time of purchase. True or false?",
    a: "True — but the precise test is ownership at the END OF THE DAY of purchase.\n\nIf buying a new main residence AND selling the old one on the same day, the surcharge may not apply if the old property is sold first. If NOT sold, the surcharge applies but can be reclaimed within 3 years if the old property is then sold.",
    explain: "This adds detail to Card 88's surcharge rule. The exact timing — end of the day, not start of the day — matters for people buying and selling on the same date.\n\nEven if the surcharge does apply because of bad timing, there's a 3-year window to reclaim it once the old property is genuinely sold."
  },
  {
    id: 162, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: For IHT annual exemption, can the current year's exemption be saved and used next year?",
    a: "No. The CURRENT YEAR'S exemption must always be used FIRST. Any PRIOR YEAR unused balance can be added — but the current year's full £3,000 must be exhausted before the carry-forward is used.",
    explain: "This restates Card 63's ordering rule. You can't deliberately skip using this year's £3,000 in order to save it — the system only allows genuinely unused amounts from last year to carry forward, and this year's allowance must be used up first regardless."
  },
  {
    id: 163, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Can a taxpayer take payments on account of CGT alongside income tax payments on account?",
    a: "No. CGT is NOT included in payments on account.\n\nCGT (except residential property disposals requiring the 60-day report) is due as a BALANCING PAYMENT on 31 January following the end of the tax year.",
    explain: "This restates Card 81's exclusion as a trap. The advance payment system only covers income tax and Class 4 NICs — Capital Gains Tax is always settled separately at the final balancing payment stage, with the one exception of the fast 60-day residential property rule from Card 48."
  },
  {
    id: 164, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: Does AIM company business relief (IHT) change in 2026?",
    a: "Yes. From 6 APRIL 2026:\n- AIM shares will only qualify for 50% business relief (currently 100%)\n- A £1 million lifetime cap applies for 100% business relief (across all qualifying assets)\n- Assets above £1m get only 50% relief",
    explain: "This restates the upcoming changes flagged in Card 68. Currently AIM shares enjoy the full 100% relief, but from April 2026 this drops to 50%, and a new £1 million overall cap is introduced limiting how much can benefit from the full 100% rate across all qualifying assets combined."
  },
  {
    id: 165, section: "Exam Traps", deck: "R03 Exam Traps",
    tier: "Tier 1", category: "Common Exam Trap",
    q: "TRAP: What happens to pension funds on death from 6 April 2027?",
    a: "Most UNUSED pension funds will become subject to IHT and included in the deceased's estate.\n\nException: transfers to spouse/civil partner remain exempt.\n\nCurrently (before 6 April 2027) pension funds are excluded property and escape IHT entirely.",
    explain: "This is a major upcoming change worth knowing for context, even though it falls just after the current exam period.\n\nToday, money left in a pension when someone dies escapes Inheritance Tax completely. From April 2027, this protection is removed for most pensions, bringing them into the estate just like other assets — except when left to a spouse or civil partner, which stays exempt as usual."
  },
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

/* Friendly, human-readable names for each syllabus section.
   The card data stores sections as "Section 1".."Section 12"; these are
   what we actually show the user across the dashboard, analytics and guide. */
const SECTION_NAMES = {
  'Section 1': 'Income Tax',
  'Section 2': 'National Insurance',
  'Section 3': 'Capital Gains Tax',
  'Section 4': 'Inheritance Tax',
  'Section 5': 'Residence & Domicile',
  'Section 6': 'Self Assessment',
  'Section 7': 'Stamp Duties',
  'Section 8': 'VAT & Corporation Tax',
  'Section 9': 'Direct Investments',
  'Section 10': 'Indirect Investments',
  'Section 11': 'Trust Taxation',
  'Section 12': 'Tax Planning',
  'Exam Traps': 'Exam Traps'
};
function friendlySection(name) {
  return SECTION_NAMES[name] || name;
}

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
    const num = parseInt((name.match(/\d+/) || [0])[0], 10);
    return `<div class="sec-row sec-row-clickable" data-section-num="${num}" title="Study ${friendlySection(name)} cards">
      <span class="sec-name">${escHtml(friendlySection(name))}</span>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${p}%"></div>
      </div>
      <span class="sec-pct">${p}%</span>
    </div>`;
  }).join('');

  el('sectionBreakdown').querySelectorAll('.sec-row-clickable').forEach(row => {
    row.addEventListener('click', () => {
      const n = parseInt(row.dataset.sectionNum, 10);
      if (n) startSectionSession(n);
    });
  });
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

  // Explanation: populate but keep hidden, reset toggle button state
  const explainEl = el('cardExplain');
  const explainBtn = el('btnShowExplain');
  if (explainEl && explainBtn) {
    explainEl.textContent = card.explain || '';
    explainEl.classList.add('hidden');
    explainBtn.classList.remove('expanded');
    setExplainButtonLabel(false);
  }

  // Progress
  const totalCards = session.original.length;
  const done = session.knownThisSession;
  const progressPct = pct(done, totalCards);
  el('sessionProgressFill').style.width = progressPct + '%';
  el('sessionProgress').textContent = `Card ${done + 1} of ${totalCards}`;
  el('sessionKnown').textContent = `${session.knownThisSession} known`;
  el('sessionUnknown').textContent = `${session.queue.length} remaining`;

  // Resize card to fit the front face (question) now showing
  requestAnimationFrame(() => resizeFlashcard(false));
}

/* Measures the natural height of whichever face should be visible
   (front = false/showing question, back = true/showing answer) and
   applies it to the .flashcard container so the layout below it
   (Know/Don't Know buttons) never overlaps the card content. */
function resizeFlashcard(showingBack) {
  const fc = el('flashcard');
  const front = document.querySelector('.card-front');
  const back = document.querySelector('.card-back');
  if (!fc || !front || !back) return;

  const MIN_HEIGHT = 300;
  const MAX_HEIGHT = Math.round(window.innerHeight * 0.7);

  const target = showingBack ? back : front;
  // scrollHeight reflects full content height even if currently clipped
  const naturalHeight = target.scrollHeight;
  const finalHeight = Math.min(Math.max(naturalHeight, MIN_HEIGHT), MAX_HEIGHT);

  fc.style.height = finalHeight + 'px';
}

function revealCard() {
  if (!session || session.queue.length === 0) return;
  el('cardAnswer').classList.remove('hidden');
  el('revealHint').classList.add('hidden');
  el('cardActions').classList.remove('hidden');

  const fc = el('flashcard');
  if (fc) fc.classList.add('flipped');

  requestAnimationFrame(() => resizeFlashcard(true));
}

const EXPLAIN_ICON_SHOW = '<svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>';
const EXPLAIN_ICON_HIDE = '<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';

function setExplainButtonLabel(expanded) {
  const btn = el('btnShowExplain');
  if (!btn) return;
  btn.innerHTML = expanded
    ? `${EXPLAIN_ICON_HIDE}Hide explanation`
    : `${EXPLAIN_ICON_SHOW}Show explanation`;
}

function toggleExplain() {
  const explainEl = el('cardExplain');
  const explainBtn = el('btnShowExplain');
  if (!explainEl || !explainBtn) return;
  const isHidden = explainEl.classList.contains('hidden');
  explainEl.classList.toggle('hidden', !isHidden);
  explainBtn.classList.toggle('expanded', isHidden);
  setExplainButtonLabel(isHidden);

  requestAnimationFrame(() => resizeFlashcard(true));
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
      <td><strong>${escHtml(friendlySection(name))}</strong></td>
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
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
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

  // Explanation toggle
  const explainBtn = el('btnShowExplain');
  if (explainBtn) {
    explainBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExplain();
    });
  }

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
    opt.value = s; opt.textContent = friendlySection(s);
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

  const detailExplainEl = el('cardDetailExplain');
  if (detailExplainEl) detailExplainEl.textContent = card.explain || '';

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
   (card flip, answer reveal, and explanation are handled
   natively inside the base showCard/revealCard functions)
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

  // Update live study sidebar
  updateStudySidebar();
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
  if (e2.target.tagName === 'INPUT' || e2.target.tagName === 'TEXTAREA' || e2.target.tagName === 'SELECT') return;
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

/* ═══════════════════════════════════════════════════
   STUDY SIDEBAR — live stats while studying
═══════════════════════════════════════════════════ */
function drawTier1Ring(pctValue) {
  const canvas = el('sideTier1Ring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 92, H = 92, cx = W / 2, cy = H / 2, r = 38, lineW = 9;

  ctx.clearRect(0, 0, W, H);

  const isDark = document.body.classList.contains('dark');
  const trackColor = isDark ? '#2D3148' : '#E2E5EB';

  // Background track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = lineW;
  ctx.stroke();

  // Progress arc
  if (pctValue > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (pctValue / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function updateStudySidebar() {
  const sideCol = el('studySideCol');
  if (!sideCol) return; // not on study session view

  const stats = computeStats();
  const readiness = computeReadiness(stats);

  // Tier 1 ring
  drawTier1Ring(readiness.t1Pct);
  const t1Label = el('sideTier1Label');
  if (t1Label) t1Label.textContent = readiness.t1Pct + '%';
  const t1Sub = el('sideTier1Sub');
  if (t1Sub) t1Sub.textContent = `${stats.t1Known} / ${stats.t1Total} cards`;

  // Exam trap mastery
  const trapBar = el('sideTrapBar');
  if (trapBar) trapBar.style.width = readiness.trapPct + '%';
  const trapSub = el('sideTrapSub');
  if (trapSub) trapSub.textContent = `${stats.trapKnown} / ${stats.trapCards.length} known`;

  // Session stats
  if (session) {
    const sKnown = el('sideSessionKnown');
    if (sKnown) sKnown.textContent = session.knownThisSession || 0;
    const sStreak = el('sideSessionStreak');
    if (sStreak) sStreak.textContent = session.currentStreak || 0;
    const sRemaining = el('sideSessionRemaining');
    if (sRemaining) sRemaining.textContent = session.queue ? session.queue.length : 0;
  }

  // Weakest decks (lowest mastery %, only decks with progress)
  const deckEntries = Object.entries(stats.decks)
    .map(([name, d]) => ({ name, ...d, pct: pct(d.known, d.total) }))
    .filter(d => d.total > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  const deckList = el('sideDeckList');
  if (deckList) {
    deckList.innerHTML = deckEntries.map(d => `
      <div class="side-deck-item">
        <span class="side-deck-name">${escHtml(d.name)}</span>
        <div class="side-deck-bar-row">
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${d.pct}%"></div></div>
          <span class="side-deck-pct">${d.pct}%</span>
        </div>
      </div>
    `).join('') || '<div class="side-panel-sub">No data yet</div>';
  }

  // Readiness badge
  const readinessBadge = el('sideReadinessBadge');
  if (readinessBadge) {
    readinessBadge.textContent = readiness.label;
    readinessBadge.className = 'side-readiness-badge ' + readiness.badge;
  }
}

/* Recompute flashcard height on viewport resize (orientation change, etc.) */
window.addEventListener('resize', () => {
  if (!session || session.queue.length === 0) return;
  const fc = el('flashcard');
  if (!fc) return;
  const isFlipped = fc.classList.contains('flipped');
  resizeFlashcard(isFlipped);
});

/* ───────────────────────────────────────────────────
   STUDY GUIDE — sticky TOC scrollspy
─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const toc = el('guideToc');
  if (!toc) return;
  const links = Array.from(toc.querySelectorAll('.guide-toc-link'));

  // Smooth-scroll to section, offset for the sticky TOC bar
  toc.addEventListener('click', (e) => {
    const link = e.target.closest('.guide-toc-link');
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.dataset.gs);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - toc.offsetHeight - 12;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });

  // Highlight the section currently in view
  const spy = () => {
    if (currentView !== 'guide') return;
    const offset = toc.offsetHeight + 24;
    let active = links[0] && links[0].dataset.gs;
    links.forEach(link => {
      const sec = document.getElementById(link.dataset.gs);
      if (sec && sec.getBoundingClientRect().top - offset <= 0) active = link.dataset.gs;
    });
    links.forEach(link => link.classList.toggle('active', link.dataset.gs === active));
    // Keep the active chip visible in the scrollable TOC
    const activeLink = links.find(l => l.dataset.gs === active);
    if (activeLink) {
      const lr = activeLink.getBoundingClientRect();
      const tr = toc.getBoundingClientRect();
      if (lr.left < tr.left || lr.right > tr.right) {
        toc.scrollTo({ left: activeLink.offsetLeft - 16, behavior: 'smooth' });
      }
    }
  };
  let spyTick = false;
  window.addEventListener('scroll', () => {
    if (spyTick) return;
    spyTick = true;
    requestAnimationFrame(() => { spy(); spyTick = false; });
  }, { passive: true });
  spy();
});

/* ═══════════════════════════════════════════════════
   STUDY GUIDE ↔ FLASHCARD INTEGRATION
   Ties the revision guide to the card deck: launch a
   section's cards straight from the guide, track which
   sections have been read, and surface that progress.
═══════════════════════════════════════════════════ */

const GUIDE_READ_KEY = 'r03_guide_read_v1';

function loadGuideRead() {
  try { return new Set(JSON.parse(localStorage.getItem(GUIDE_READ_KEY) || '[]')); }
  catch (e) { return new Set(); }
}
function saveGuideRead(set) {
  try { localStorage.setItem(GUIDE_READ_KEY, JSON.stringify([...set])); } catch (e) {}
}
let guideRead = loadGuideRead();

/* Cards belonging to a syllabus section number (1..12). */
function cardsForSectionNum(n) {
  return CARDS_RAW.filter(c => c.section === 'Section ' + n);
}

/* Start a study session for one syllabus section. Prioritises cards
   not yet marked Known, but falls back to the whole section if the
   learner already knows them all. */
function startSectionSession(n) {
  const all = cardsForSectionNum(n);
  if (all.length === 0) {
    alert('There are no flashcards for this section yet.');
    return;
  }
  const notKnown = all.filter(c => getCardProgress(c.id).status !== 'known');
  const cards = notKnown.length ? notKnown : all;

  navigateTo('study');

  session = {
    mode: 'section',
    queue: shuffle([...cards]),
    original: [...cards],
    knownThisSession: 0,
    totalStarted: cards.length,
    dontKnowThisSession: 0,
    undoStack: []
  };

  el('study-mode-selector').classList.add('hidden');
  el('study-session').classList.remove('hidden');
  el('sessionComplete').classList.add('hidden');
  el('cardContainer').classList.remove('hidden');
  el('cardActions').classList.add('hidden');
  el('btnUndo').classList.add('hidden');
  el('sessionMode').textContent = friendlySection('Section ' + n);
  showCard();
}

document.addEventListener('DOMContentLoaded', () => {
  const guideBody = document.querySelector('.guide-body');
  if (!guideBody) return;

  const sections = Array.from(guideBody.querySelectorAll('.gd-section'));

  sections.forEach((sec, idx) => {
    const num = parseInt((sec.id.match(/\d+/) || [0])[0], 10);
    const total = cardsForSectionNum(num).length;

    // ── Top toolbar: practice + mark-as-read ──
    const bar = document.createElement('div');
    bar.className = 'gd-toolbar';
    const practiceLabel = total ? `Practice ${total} cards` : 'No cards yet';
    bar.innerHTML =
      `<button class="gd-tool-btn gd-tool-practice" data-num="${num}" ${total ? '' : 'disabled'}>
         <svg viewBox="0 0 24 24" width="15" height="15"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
         ${practiceLabel}
       </button>
       <button class="gd-tool-btn gd-tool-read" data-num="${num}">
         <span class="gd-read-idle">Mark as read</span>
         <span class="gd-read-done">✓ Read</span>
       </button>`;
    const title = sec.querySelector('.gd-title');
    title.insertAdjacentElement('afterend', bar);

    // ── Bottom nav: prev / next / top ──
    const nav = document.createElement('div');
    nav.className = 'gd-section-nav';
    const prev = sections[idx - 1];
    const next = sections[idx + 1];
    const cleanTitle = t => escHtml(t.querySelector('.gd-title').textContent.replace(/^\d+/, '').trim());
    nav.innerHTML =
      (prev ? `<button class="gd-nav-btn" data-go="${prev.id}">← ${cleanTitle(prev)}</button>` : '<span></span>') +
      `<button class="gd-nav-btn gd-nav-top" data-top="1">↑ Top</button>` +
      (next ? `<button class="gd-nav-btn" data-go="${next.id}">${cleanTitle(next)} →</button>` : '<span></span>');
    sec.appendChild(nav);
  });

  // Practice buttons
  guideBody.querySelectorAll('.gd-tool-practice').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.num, 10);
      if (n) startSectionSession(n);
    });
  });

  // Mark-as-read toggles
  function refreshReadState() {
    guideBody.querySelectorAll('.gd-tool-read').forEach(btn => {
      const n = parseInt(btn.dataset.num, 10);
      btn.classList.toggle('is-read', guideRead.has(n));
    });
    document.querySelectorAll('.guide-toc-link').forEach(link => {
      const n = parseInt((link.dataset.gs.match(/\d+/) || [0])[0], 10);
      link.classList.toggle('toc-read', guideRead.has(n));
    });
    const readEl = el('guideReadCount');
    if (readEl) readEl.textContent = guideRead.size;
    const readBar = el('guideReadBar');
    if (readBar) readBar.style.width = Math.round((guideRead.size / 12) * 100) + '%';
  }
  guideBody.querySelectorAll('.gd-tool-read').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.num, 10);
      if (guideRead.has(n)) guideRead.delete(n); else guideRead.add(n);
      saveGuideRead(guideRead);
      refreshReadState();
    });
  });

  // Section nav (prev / next / top)
  guideBody.querySelectorAll('.gd-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.top) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.getElementById(btn.dataset.go);
      if (!target) return;
      const toc = el('guideToc');
      const y = target.getBoundingClientRect().top + window.scrollY - (toc ? toc.offsetHeight : 0) - 12;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // Expose so the dashboard guide panel can refresh after navigation
  window.__refreshGuideRead = refreshReadState;
  refreshReadState();
});
