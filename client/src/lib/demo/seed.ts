// Sample data for the no-login demo build (VITE_DEMO / `--mode demo`).
// Everything here is made up for illustration - swap in real LASA
// announcements and club info before showing it off.

import { toDateKey } from '@/lib/school'

export const DEMO_USER_ID = 'demo-user'
export const DEMO_EMAIL = 'student@lasa.example'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Timestamps are generated relative to the first time the demo loads, so
// the content always looks fresh
export const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

// Event dates are also relative, so there's always something coming up.
// nextWeekday(3) = the next Wednesday (today counts if it's Wednesday).
const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}
const nextWeekday = (weekday: number, weeksLater = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7) + weeksLater * 7)
  return toDateKey(d)
}

export const seedProfiles = [
  { id: DEMO_USER_ID, display_name: 'John Doe', bio: 'Junior at LASA. Physics, violin, and too many tabs open.', subjects_public: true },
  { id: 'u-maya', display_name: 'Maya Chen', bio: 'Senior • Science Olympiad', subjects_public: true },
  { id: 'u-jordan', display_name: 'Jordan Patel', bio: 'Calc BC survivor', subjects_public: true },
  { id: 'u-sofia', display_name: 'Sofia Ramirez', bio: '', subjects_public: false },
  { id: 'u-ethan', display_name: 'Ethan Nguyen', bio: 'Hack Club regular', subjects_public: true },
  { id: 'u-priya', display_name: 'Priya Shah', bio: 'APUSH enjoyer', subjects_public: true },
  { id: 'u-council', display_name: 'LASA Student Council', bio: 'Official-ish announcements from StuCo', subjects_public: false },
]

export const seedSubjects = [
  { id: 1, name: 'English I', category: 'English' },
  { id: 2, name: 'AP English Language', category: 'English' },
  { id: 3, name: 'AP English Literature', category: 'English' },
  { id: 4, name: 'Geometry', category: 'Math' },
  { id: 5, name: 'Algebra II', category: 'Math' },
  { id: 6, name: 'Precalculus', category: 'Math' },
  { id: 7, name: 'AP Calculus AB', category: 'Math' },
  { id: 8, name: 'AP Calculus BC', category: 'Math' },
  { id: 9, name: 'Multivariable Calculus', category: 'Math' },
  { id: 10, name: 'AP Statistics', category: 'Math' },
  { id: 11, name: 'Biology', category: 'Science' },
  { id: 12, name: 'Chemistry', category: 'Science' },
  { id: 13, name: 'AP Physics 1', category: 'Science' },
  { id: 14, name: 'AP Physics C: Mechanics', category: 'Science' },
  { id: 15, name: 'AP Chemistry', category: 'Science' },
  { id: 16, name: 'AP Biology', category: 'Science' },
  { id: 17, name: 'Biotechnology', category: 'Science' },
  { id: 18, name: 'AP Human Geography', category: 'Social Studies' },
  { id: 19, name: 'AP World History', category: 'Social Studies' },
  { id: 20, name: 'AP U.S. History', category: 'Social Studies' },
  { id: 21, name: 'AP Government', category: 'Social Studies' },
  { id: 22, name: 'AP Macroeconomics', category: 'Social Studies' },
  { id: 23, name: 'Japanese II', category: 'World Language' },
  { id: 24, name: 'Spanish III', category: 'World Language' },
  { id: 25, name: 'Chinese II', category: 'World Language' },
  { id: 26, name: 'Latin II', category: 'World Language' },
  { id: 27, name: 'Computer Science I', category: 'CTE' },
  { id: 28, name: 'AP Computer Science A', category: 'CTE' },
  { id: 29, name: 'Engineering Design', category: 'CTE' },
  { id: 30, name: 'Orchestra', category: 'Fine Arts' },
  { id: 31, name: 'Band', category: 'Fine Arts' },
  { id: 32, name: 'Art I', category: 'Fine Arts' },
  { id: 33, name: 'Theatre', category: 'Fine Arts' },
  { id: 34, name: 'Athletics', category: 'Athletic' },
  { id: 35, name: 'SAT / PSAT Prep', category: 'Miscellaneous' },
]

export const seedUserSubjects = [14, 8, 2, 20, 23, 17].map((subject_id) => ({
  user_id: DEMO_USER_ID,
  subject_id,
}))

// Note content is written as plain lines and turned into a PDF on first
// load: "# " = heading, "- " = bullet, "" = blank line, anything else = text.
// Stick to plain ASCII - the built-in PDF font can't draw fancy symbols.
export type SeedNote = {
  id: number
  user_id: string
  title: string
  subject_id: number
  description: string
  saves: number
  ageMs: number
  lines: string[]
}

export const seedNotes: SeedNote[] = [
  {
    id: 1,
    user_id: 'u-maya',
    title: 'Kinematics & Projectile Motion Cheat Sheet',
    subject_id: 14,
    description: 'Everything from Unit 1 on two pages. Calculus versions of the kinematic equations included.',
    saves: 41,
    ageMs: 3 * DAY,
    lines: [
      '# Definitions',
      '- Position x(t). Velocity v = dx/dt. Acceleration a = dv/dt = d2x/dt2.',
      '- Displacement = integral of v dt. Change in velocity = integral of a dt.',
      '- Speed is |v|. Average velocity = (change in x) / (change in t).',
      '',
      '# Constant acceleration (only when a is constant!)',
      '- v = v0 + a t',
      '- x = x0 + v0 t + (1/2) a t^2',
      '- v^2 = v0^2 + 2 a (x - x0)',
      '- x - x0 = (1/2)(v0 + v) t',
      '',
      '# Projectile motion',
      '- Split into x and y. x: a = 0. y: a = -g (g = 9.8 m/s^2).',
      '- v0x = v0 cos(theta), v0y = v0 sin(theta).',
      '- Time of flight (level ground): T = 2 v0 sin(theta) / g.',
      '- Range (level ground): R = v0^2 sin(2 theta) / g. Max at 45 degrees.',
      '- Max height: H = (v0 sin(theta))^2 / (2g).',
      '',
      '# Common mistakes',
      '- Using constant-a equations when a depends on t (use calculus instead).',
      '- Forgetting that vertical velocity is ZERO at the top, not total velocity.',
      '- Mixing signs: pick up = + and stick with it.',
    ],
  },
  {
    id: 2,
    user_id: 'u-jordan',
    title: 'Series Convergence Tests - Decision Tree',
    subject_id: 8,
    description: 'Which test to try first, in order. Saved me on the Unit 10 test.',
    saves: 57,
    ageMs: 6 * DAY,
    lines: [
      '# Step 1: nth term test',
      '- If lim a_n is not 0, the series DIVERGES. (If it is 0, you learn nothing.)',
      '',
      '# Step 2: recognize the type',
      '- Geometric: sum of a r^n converges iff |r| < 1. Sum = a / (1 - r).',
      '- p-series: sum of 1/n^p converges iff p > 1.',
      '- Alternating: if b_n decreases to 0, sum of (-1)^n b_n converges.',
      '- Telescoping: write out partial sums and cancel.',
      '',
      '# Step 3: compare',
      '- Direct comparison: smaller than a convergent series -> converges.',
      '- Limit comparison: lim a_n/b_n = finite positive -> same behavior.',
      '',
      '# Step 4: ratio / root',
      '- Ratio test: L = lim |a_(n+1)/a_n|. L < 1 converges, L > 1 diverges, L = 1 no info.',
      '- Use ratio for factorials and exponentials.',
      '',
      '# Step 5: integral test',
      '- f positive, continuous, decreasing: sum and integral do the same thing.',
      '',
      '# Absolute vs conditional',
      '- Absolutely convergent: sum of |a_n| converges.',
      '- Conditionally convergent: converges, but sum of |a_n| diverges.',
      '- Alternating series error bound: |error| <= first omitted term.',
    ],
  },
  {
    id: 3,
    user_id: 'u-priya',
    title: 'APUSH Period 3 (1754-1800) Key Concepts',
    subject_id: 20,
    description: 'French & Indian War through Washington. Organized by the College Board key concepts.',
    saves: 33,
    ageMs: 2 * DAY,
    lines: [
      '# 3.1 Road to revolution',
      '- French and Indian War (1754-1763) leaves Britain in debt.',
      '- Proclamation of 1763 bans settlement west of the Appalachians.',
      '- Sugar Act, Stamp Act, Townshend Acts: "no taxation without representation".',
      '- Boston Massacre (1770), Tea Party (1773), Coercive/Intolerable Acts (1774).',
      '',
      '# 3.2 The Revolution',
      '- Common Sense (Paine, 1776) builds support for independence.',
      '- Declaration of Independence draws on Enlightenment ideas (Locke).',
      '- Saratoga (1777) brings the French alliance. Yorktown (1781). Treaty of Paris (1783).',
      '',
      '# 3.3 Building a government',
      '- Articles of Confederation: weak central government, no power to tax.',
      '- Shays Rebellion (1786) shows the weakness.',
      '- Constitutional Convention: Great Compromise, 3/5 Compromise.',
      '- Federalists vs Anti-Federalists; Bill of Rights added in 1791.',
      '',
      '# Thematic connections',
      '- Debates over federal power continue into Period 4 (Hamilton vs Jefferson).',
    ],
  },
  {
    id: 4,
    user_id: 'u-sofia',
    title: 'Rhetorical Analysis Essay Template',
    subject_id: 2,
    description: 'Thesis formula + paragraph structure that got me 5s on the practice FRQs.',
    saves: 48,
    ageMs: 9 * DAY,
    lines: [
      '# Thesis formula',
      '- [Speaker] [verb: argues/urges/criticizes] that [claim] by [choice 1], [choice 2], and [choice 3] in order to [purpose] for [audience].',
      '',
      '# Body paragraph (repeat per choice)',
      '- Topic sentence: names the rhetorical CHOICE, not just a device.',
      '- Evidence: short embedded quote.',
      '- Commentary: explain HOW the choice works on the audience and WHY.',
      '- Tie back to the purpose. Commentary should be longer than the evidence!',
      '',
      '# Sophistication point ideas',
      '- Explain the complexity or tension in the rhetorical situation.',
      '- Explain the significance of choices for the context of the time.',
      '- Keep a vivid, consistent style throughout.',
      '',
      '# Verbs that are better than "says"',
      '- asserts, concedes, juxtaposes, underscores, evokes, dismisses, reframes',
    ],
  },
  {
    id: 5,
    user_id: 'u-maya',
    title: 'Cellular Respiration Overview',
    subject_id: 16,
    description: 'Glycolysis -> Krebs -> ETC with ATP counts at each step.',
    saves: 22,
    ageMs: 12 * DAY,
    lines: [
      '# Big picture',
      '- C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ATP',
      '',
      '# Glycolysis (cytoplasm)',
      '- Glucose -> 2 pyruvate. Net 2 ATP, 2 NADH. No oxygen needed.',
      '',
      '# Pyruvate oxidation (mitochondrial matrix)',
      '- Pyruvate -> acetyl CoA, releases CO2, makes NADH.',
      '',
      '# Krebs / citric acid cycle (matrix)',
      '- Per glucose: 2 ATP, 6 NADH, 2 FADH2, 4 CO2.',
      '',
      '# Electron transport chain (inner membrane)',
      '- NADH and FADH2 drop electrons; O2 is the final electron acceptor.',
      '- Proton gradient powers ATP synthase (chemiosmosis). Roughly 26-28 ATP.',
      '',
      '# Fermentation',
      '- No O2: regenerate NAD+ via lactic acid or alcohol fermentation.',
    ],
  },
  {
    id: 6,
    user_id: 'u-ethan',
    title: 'Big-O Cheat Sheet for AP CSA',
    subject_id: 28,
    description: 'Runtimes for loops, searches and sorts you need for the AP exam.',
    saves: 29,
    ageMs: 4 * DAY,
    lines: [
      '# Loops',
      '- Single loop over n items: O(n).',
      '- Nested loops over n items: O(n^2).',
      '- Loop that halves each time: O(log n).',
      '',
      '# Searching',
      '- Linear search: O(n). Works on any list.',
      '- Binary search: O(log n). List MUST be sorted.',
      '',
      '# Sorting (AP subset)',
      '- Selection sort: O(n^2) always.',
      '- Insertion sort: O(n^2) worst, O(n) when already sorted.',
      '- Merge sort: O(n log n). Recursive, needs extra space.',
      '',
      '# ArrayList operations',
      '- get/set: O(1). add at end: O(1) amortized.',
      '- add/remove at index i: O(n) because elements shift.',
    ],
  },
  {
    id: 7,
    user_id: 'u-jordan',
    title: 'Japanese II - Te-form Conjugation Rules',
    subject_id: 23,
    description: 'Group 1 / 2 / 3 verbs with the sound-change chart (romaji).',
    saves: 18,
    ageMs: 1 * DAY,
    lines: [
      '# Group 2 (ru-verbs)',
      '- Drop -ru, add -te. taberu -> tabete, miru -> mite.',
      '',
      '# Group 1 (u-verbs) sound changes',
      '- -u, -tsu, -ru -> -tte. kau -> katte, matsu -> matte, kaeru -> kaette.',
      '- -mu, -bu, -nu -> -nde. yomu -> yonde, asobu -> asonde, shinu -> shinde.',
      '- -ku -> -ite. kaku -> kaite. EXCEPTION: iku -> itte.',
      '- -gu -> -ide. oyogu -> oyoide.',
      '- -su -> -shite. hanasu -> hanashite.',
      '',
      '# Group 3 (irregular)',
      '- suru -> shite. kuru -> kite.',
      '',
      '# Uses',
      '- Requests: -te kudasai. Ongoing action: -te imasu. Linking actions: A-te, B.',
    ],
  },
  {
    id: 8,
    user_id: DEMO_USER_ID,
    title: 'Newton\'s Laws Practice Problems (worked)',
    subject_id: 14,
    description: 'My worked solutions for the Atwood machine + incline set.',
    saves: 12,
    ageMs: 5 * DAY,
    lines: [
      '# Problem 1: Atwood machine',
      '- m1 = 3 kg, m2 = 5 kg over a massless pulley.',
      '- Net force: (m2 - m1) g. Total mass: m1 + m2.',
      '- a = (m2 - m1) g / (m1 + m2) = 2(9.8)/8 = 2.45 m/s^2.',
      '- Tension: T = m1 (g + a) = 3(12.25) = 36.75 N.',
      '',
      '# Problem 2: block on frictionless incline',
      '- Along the incline: a = g sin(theta).',
      '- Normal force: N = m g cos(theta).',
      '',
      '# Problem 3: incline with friction',
      '- Sliding down: a = g (sin(theta) - mu_k cos(theta)).',
      '- Block stays still if tan(theta) <= mu_s.',
      '',
      '# Strategy',
      '- Draw the FBD first. Pick axes along the motion. Write F = ma per axis.',
    ],
  },
  {
    id: 9,
    user_id: 'u-priya',
    title: 'AP Gov Required Court Cases (Quick Reference)',
    subject_id: 21,
    description: 'All 15 SCOTUS cases with the one-line holding you need.',
    saves: 37,
    ageMs: 15 * DAY,
    lines: [
      '# Federalism',
      '- McCulloch v. Maryland (1819): implied powers; federal law is supreme over states.',
      '- U.S. v. Lopez (1995): limits on the commerce clause (guns near schools).',
      '',
      '# Civil liberties',
      '- Engel v. Vitale (1962): no school-sponsored prayer.',
      '- Wisconsin v. Yoder (1972): free exercise; Amish exempt from compulsory school past 8th grade.',
      '- Tinker v. Des Moines (1969): students keep free speech rights at school.',
      '- New York Times v. U.S. (1971): no prior restraint (Pentagon Papers).',
      '- Schenck v. U.S. (1919): clear and present danger.',
      '- Gideon v. Wainwright (1963): right to an attorney applies to states.',
      '- McDonald v. Chicago (2010): 2nd Amendment applies to states.',
      '',
      '# Civil rights',
      '- Brown v. Board (1954): school segregation is unconstitutional.',
      '',
      '# Elections and representation',
      '- Baker v. Carr (1962): redistricting is justiciable (one person, one vote).',
      '- Shaw v. Reno (1993): racial gerrymandering limits.',
      '- Citizens United v. FEC (2010): political spending is protected speech.',
      '',
      '# Judicial power',
      '- Marbury v. Madison (1803): judicial review.',
    ],
  },
  {
    id: 10,
    user_id: 'u-ethan',
    title: 'PCR & Gel Electrophoresis Lab Notes',
    subject_id: 17,
    description: 'Steps, temps and how to read a gel. From the Unit 3 lab.',
    saves: 15,
    ageMs: 7 * DAY,
    lines: [
      '# PCR cycle',
      '- Denature ~95 C: strands separate.',
      '- Anneal ~55-65 C: primers bind.',
      '- Extend ~72 C: Taq polymerase adds nucleotides.',
      '- Each cycle roughly doubles the target: 2^n copies after n cycles.',
      '',
      '# Gel electrophoresis',
      '- DNA is negative, so it runs toward the positive (red) electrode.',
      '- Smaller fragments travel farther.',
      '- Use a ladder of known sizes to estimate fragment length.',
      '',
      '# Lab safety reminders',
      '- Gloves for the stain. Never touch the gel box while it is running.',
    ],
  },
  {
    id: 11,
    user_id: 'u-sofia',
    title: 'Precalc Unit Circle + Identities',
    subject_id: 6,
    description: 'Exact values and the identities you actually need to memorize.',
    saves: 26,
    ageMs: 20 * DAY,
    lines: [
      '# Unit circle (first quadrant)',
      '- 0: (1, 0)    pi/6: (sqrt3/2, 1/2)    pi/4: (sqrt2/2, sqrt2/2)',
      '- pi/3: (1/2, sqrt3/2)    pi/2: (0, 1)',
      '- Point is (cos, sin). tan = sin/cos.',
      '',
      '# Identities',
      '- sin^2 + cos^2 = 1. Divide by cos^2: tan^2 + 1 = sec^2.',
      '- sin(2x) = 2 sin x cos x.',
      '- cos(2x) = cos^2 x - sin^2 x = 1 - 2 sin^2 x = 2 cos^2 x - 1.',
      '- sin(a + b) = sin a cos b + cos a sin b.',
      '- cos(a + b) = cos a cos b - sin a sin b.',
    ],
  },
  {
    id: 12,
    user_id: 'u-maya',
    title: 'Science Olympiad: Thermodynamics Formula Sheet',
    subject_id: 15,
    description: 'Shared from the Scioly binder - heat transfer, specific heat, and gas laws.',
    saves: 21,
    ageMs: 10 * DAY,
    lines: [
      '# Heat',
      '- Q = m c (change in T). Water: c = 4.186 J/(g C).',
      '- Phase change: Q = m L. L_fusion (water) = 334 J/g. L_vaporization = 2260 J/g.',
      '',
      '# Heat transfer',
      '- Conduction: P = k A (change in T) / d.',
      '- Radiation: P = e sigma A T^4 (T in kelvin!).',
      '',
      '# Gas laws',
      '- PV = nRT, R = 8.314 J/(mol K).',
      '',
      '# First law',
      '- Change in U = Q - W (W = work done BY the gas).',
    ],
  },
]

// Notes the demo user has starred
export const seedSaves = [1, 2, 9].map((note_id) => ({
  user_id: DEMO_USER_ID,
  note_id,
}))

// Simple SVG banners so a few posts have images without needing hosting
function banner(bg: string, fg: string, big: string, small: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="${bg}"/><circle cx="1350" cy="160" r="260" fill="${fg}" opacity="0.12"/><circle cx="180" cy="820" r="200" fill="${fg}" opacity="0.10"/><text x="120" y="470" font-family="Georgia, serif" font-size="132" font-weight="700" fill="${fg}">${big}</text><text x="124" y="570" font-family="Helvetica, Arial, sans-serif" font-size="52" fill="${fg}" opacity="0.85">${small}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

type SeedPost = {
  user_id: string
  title: string
  description: string
  category: 'School' | 'Club' | 'Event'
  pinned?: boolean
  image_url?: string | null
  event_date?: string | null
  event_time?: string | null
  location?: string | null
  ageMs: number
}

const posts: SeedPost[] = [
  {
    user_id: 'u-council',
    title: 'Homecoming Week Dress-Up Days',
    description:
      'Mon - Pajama Day\nTue - Twin Day\nWed - Decades Day\nThu - Anything But a Backpack\nFri - Raptor Spirit (navy and silver!)\n\nDance tickets are on sale at lunch all week.',
    category: 'School',
    pinned: true,
    image_url: banner('#0c2340', '#ffffff', 'Homecoming Week', 'Dress-up days + dance tickets at lunch'),
    event_date: nextWeekday(1),
    event_time: 'All week',
    ageMs: 5 * HOUR,
  },
  {
    user_id: 'u-council',
    title: 'PSAT Day - Modified Schedule',
    description:
      'Juniors take the PSAT in the morning. Everyone else follows the modified bell schedule. Bring a fully charged device with Bluebook installed.',
    category: 'School',
    pinned: true,
    event_date: nextWeekday(3, 1),
    event_time: 'Morning',
    ageMs: 1 * DAY,
  },
  {
    user_id: 'u-maya',
    title: 'Science Olympiad: Invitational Sign-ups Close Friday',
    description:
      'If you want to compete at the next invitational, fill out the event preference form by Friday. New members welcome - we train you!',
    category: 'Club',
    event_date: nextWeekday(5),
    event_time: 'Deadline',
    ageMs: 1 * DAY + 3 * HOUR,
  },
  {
    user_id: 'u-ethan',
    title: 'Hack Club: Build Night',
    description:
      "Bring a laptop and an idea (or don't - we'll give you one). Snacks provided. All skill levels welcome.",
    category: 'Club',
    image_url: banner('#98999b', '#0c2340', 'Hack Club', 'Wednesday lunch - all skill levels welcome'),
    event_date: nextWeekday(3),
    event_time: 'Lunch',
    ageMs: 2 * DAY,
  },
  {
    user_id: 'u-council',
    title: 'Homecoming Dance',
    description: 'Wear your best. Student ID required at the door. Tickets sold at lunch until Friday.',
    category: 'Event',
    event_date: nextWeekday(6, 1),
    event_time: '7:00 PM',
    location: 'Cafeteria',
    ageMs: 2 * DAY + 4 * HOUR,
  },
  {
    user_id: 'u-priya',
    title: 'Model UN Info Meeting',
    description:
      "No experience needed. We'll cover how committees work and how to pick a country for the spring conference.",
    category: 'Club',
    event_date: nextWeekday(4),
    event_time: 'Lunch',
    ageMs: 3 * DAY,
  },
  {
    user_id: 'u-council',
    title: 'Junior College Night',
    description:
      'An evening session on the college search, testing timelines, and scholarships. Families welcome.',
    category: 'Event',
    event_date: nextWeekday(4, 1),
    event_time: '6:30 PM',
    location: 'Library',
    ageMs: 3 * DAY + 6 * HOUR,
  },
  {
    user_id: 'u-jordan',
    title: 'Orchestra Fall Concert',
    description: 'Come support the orchestra! Free admission, all ages.',
    category: 'Event',
    event_date: nextWeekday(2, 2),
    event_time: '7:00 PM',
    location: 'Auditorium',
    ageMs: 4 * DAY,
  },
  {
    user_id: 'u-council',
    title: 'Lost & Found Clears Out Friday',
    description:
      'Everything left in the lost & found by the front office will be donated after school Friday. Lots of water bottles and hoodies in there right now.',
    category: 'School',
    image_url: banner('#2c4466', '#e4e7ec', 'Lost & Found', 'Donated after school Friday'),
    event_date: nextWeekday(5),
    event_time: 'After school',
    ageMs: 5 * DAY,
  },
  {
    user_id: 'u-ethan',
    title: 'Robotics Team Looking for Programmers',
    description:
      'We need people who can write (or want to learn) Java for the competition robot. Stop by any meeting to try it out.',
    category: 'Club',
    ageMs: 6 * DAY,
  },
  {
    user_id: 'u-council',
    title: 'End of the Grading Period',
    description: 'Last day for late work in most classes is the Friday before. Check each class for its policy.',
    category: 'School',
    event_date: nextWeekday(5, 2),
    ageMs: 7 * DAY,
  },
]

export const seedBulletin = posts.map(({ ageMs, ...p }, i) => ({
  id: i + 1,
  image_url: null,
  pinned: false,
  event_date: null,
  event_time: null,
  location: null,
  ...p,
  created_at: ago(ageMs),
}))

export const seedTodos = [
  { id: 1, user_id: DEMO_USER_ID, title: 'Physics C problem set (Ch. 5)', due_date: inDays(1), done: false, created_at: ago(DAY) },
  { id: 2, user_id: DEMO_USER_ID, title: 'Calc BC quiz corrections', due_date: inDays(2), done: false, created_at: ago(DAY) },
  { id: 3, user_id: DEMO_USER_ID, title: 'Sign up for the Scioly invitational', due_date: nextWeekday(5), done: false, created_at: ago(2 * DAY) },
  { id: 4, user_id: DEMO_USER_ID, title: 'Buy homecoming tickets', due_date: null, done: true, created_at: ago(3 * DAY) },
]
