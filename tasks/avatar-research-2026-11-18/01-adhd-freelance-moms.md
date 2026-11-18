# Avatar pain research 01: ADHD moms who freelance / are self-employed / work from home

Date: 2026-11-18. Researcher pass 2 (deepens `.claude/skills/carousel/jess.md`, does not repeat it).
Product-agnostic: no product was searched for or assumed. Quotes are verbatim, copied from the raw Reddit JSON
(saved in the session scratchpad `avatar-moms-freelance/`) or from the page text of the web sources. Upvote counts were
taken on 2026-11-18 and keep changing.

---

## 1. Sample

| Item | Count |
|---|---|
| Reddit searches run | **56** (41 sorted "top" + 15 sorted "relevance"); 1 failed (r/AdultADHD) |
| Subreddits searched | 15: adhdwomen, ADHD, ADHDmoms, workingmoms, Mommit, Parenting, SAHP, freelance, freelanceWriters, graphic_design, VirtualAssistant, WorkOnline, Entrepreneur, smallbusiness, adhd_anxiety |
| Unique posts collected | **2,055** (adhdwomen 982, ADHD 245, workingmoms 200, Mommit 150, freelance 105, freelanceWriters 84, ADHDmoms 57, other 232) |
| "Avatar-core" posts (mentions own kids AND a work-from-home / self-employed / client context) | **203** (114 of them self-employed / clients / own business) |
| Non-parent work-context comparison set | 496 |
| **Full threads read with comments** | **63 Reddit threads** (10 to 16 top comments each) + 7 non-Reddit pages (5 Mumsnet threads, 2 Understood.org first-person stories) |
| Threads read where the poster is a parent | 48 of 63 |
| Threads read where the poster is self-employed / freelance / runs a business | 22 of 63 (13 of them also parents) |

How the numbers were made:
- **Thread-level coding (main ranking):** I read and hand-coded each of the 63 threads (OP + top comments) for themes.
  Frequency = number of those 63 threads where the theme is a central pain.
- **Keyword pass (secondary, shown in §3b):** a regex theme count over the 203 core posts vs 496 non-parent work posts
  (title + body only). This is cruder and only used for the parent vs non-parent comparison.

---

## 2. Ranked pain themes (thread-level, n = 63 read threads)

Scores: **Intensity** 1-5 (5 = crying, shame, fear for income / marriage / kids). **Unsolved** 1-5 (5 = "nothing works",
no good answer in comments). **Hot x Unsolved** = Intensity x Unsolved (max 25).

| # | Theme | Threads (of 63) | % | Parents in it | Intensity | Unsolved | Hot x Unsolved | Money signal | Top post score |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **No uninterrupted block: kids home / summer / sick days / "mom. Mom. Mooom"** | 16 | 25% | 16 of 16 | 4 | **5** | **20** | camp ("expensive"), at-home babysitters ("still noisy"), daycare, coworking desk | 968 (1f1iodo), 803-up comment in rqpn1j |
| 2 | **Client ghosting + missed deadlines spiral** (avoid the email, slip the deadline, burn the client) | 12 | 19% (**45% of the 22 self-employed threads**) | 3 of 12 | **5** | 4 | **20** | assistant ("I even have an assistant"), Toggl, Timeular, coaching suggested | 665 (llbs6e), 91 (1c6gbdv), 79 (guouby) |
| 3 | **Can't start inside the window** (freeze at nap / drop-off, waiting mode) | 8 explicit | 13% (implicit in most of #1) | 7 of 8 | 4 | **5** | **20** | meds + therapy and "still get so frozen" | 93 (1l8zom9), jess.md threads up to 239 |
| 4 | **Income / breadwinner fear** ("if I lost my job tomorrow, we'd be screwed") | 20 | 32% | 17 of 20 | **5** | 3 | 15 | therapy, meds, outsourcing; "$25,000 in credit card debt" | 402 (1i20wb5), 289 (1ngdhnu) |
| 5 | **No external structure** (no boss, nobody watching; only other people's deadlines work) | 15 | 24% | 8 of 15 | 4 | 4 | 16 | coworking, coaches, Focusmate, "asking for strict deadlines" | 874 (1mbq61l) |
| 6 | **Can't do both: work vs house** (mental load, default parent) | 18 | 29% | 17 of 18 | 3 | 3 | 9 | cleaner ("less than $200/month"), meal delivery, takeout | 239 (1kwap1a, 203-up comment) |
| 7 | **Burnout / sleep debt / exhaustion** | 18 | 29% | 15 of 18 | 4 | 3 | 12 | meds, HRT, therapy, telehealth | 6,039 (1hvak28, non-parent) |
| 8 | **Guilt / shame / "bad mom" / "flakey"** | 16 | 25% | 12 of 16 | 5 | 3 | 15 | therapy | 402 (1i20wb5) |
| 9 | **Tools and planners stop working** | 12 | 19% | 8 of 12 | 3 | 4 | 12 | Finch paid tier, smart watch, Amazon ADHD planner, Toggl | 299 (1jk15k0) |
| 10 | **Admin / bills / paperwork** (utilities cut off, late taxes) | 9 | 14% | 7 of 9 | 4 | 3 | 12 | password manager, autopay | 881 (1pctmqo) |
| 11 | **Rage / overstimulation while working** | 6 | 10% | 6 of 6 | 4 | 3 | 12 | loop earbuds, headphones | 50 |

Reading the table: themes 1-3 share the top Hot x Unsolved score (20). They are one causal chain, not three
separate pains (see §4). Theme 4 (money fear) is the emotional fuel; it is hot but people treat it as structural, so
they don't look for a tool for it.

---

## 3. Parent vs non-parent, freelancer vs employee

### 3a. What kids change (from the 63 threads)
- **Non-parent ADHD freelancers** (r/freelance, r/freelanceWriters, r/ADHD) complain about: missed deadlines, avoided
  messages, no structure, undercharging, burnout. They **still have long stretches and late nights** to rescue a
  deadline ("it's usually 1 or 2am before on Monday before I submit the project", 1c6gbdv).
- **Moms lose the rescue move.** The ADHD freelancer's working mode is a deadline sprint / hyperfocus marathon. Kids
  take away the marathon (no long block, no all-nighter on 3-4 hours of sleep). So the same procrastination that a
  non-parent freelancer survives turns into failure for a mom. Evidence in §4.1.
- **Her work is the one that gives way.** In two-income homes the salaried partner's day is protected, so the
  self-employed mom's business soaks up every sick day and summer week:
  > "my husband gets to work full uninterrupted days ... He is a good, involved partner - but realistically we have to prioritize his work days. Meanwhile, I get an hour or two here or there." (r/adhdwomen, 1v5hug7)

### 3b. Keyword pass (title + body only; crude, directional)
| Theme | Moms with a WFH / self-employed context (n=203) | Non-parents with a work context (n=496) |
|---|---|---|
| Kids home / summer / sick | 12.3% | 3.6% |
| Small window / nap / after bedtime | 16.3% | 3.4% |
| Interruptions | 10.8% | 2.0% |
| Guilt / shame | 21.2% (26.3% among self-employed moms) | 16.3% |
| Can't start / paralysis words | 11.3% (15.8% self-employed moms) | 19.4% |
| Client / message dread | 14.8% | 17.9% |
| Money / income fear | 44.8% | 35.9% |
| Partner / spouse mentioned | 58.6% | 14.7% |

Moms describe their stuck-ness as a **time and interruption problem**. Non-parents describe it as a **paralysis
problem**. It is the same deficit, but moms find it in their calendar, not in their brain. That matters for how a
message lands (see §8).

### 3c. Freelancer moms vs employee moms
- **Employee moms** (r/workingmoms, corporate ADHD moms): pain = default-parent load, sleep, RTO, sick-day juggling,
  being judged, breadwinner pressure. Work itself has scaffolding (boss, meetings, team).
- **Freelance / self-employed moms** add: no external structure, client dread, invoicing and money tracking, income
  swings, and their work being the "flexible" one at home. Clearest line in the whole sample:
  > "The interesting thing is this would ONLY happen with freelance jobs and never when I was working under a design firm. It is like I felt confident when someone else was shouldering the responsibility, but on my own I fell apart." (r/adhdwomen, pjry82, mom returning to freelance now that her kids are in school)
- Several posters moved from employee to self-employed **to get flexibility for kids** and then burned out on it:
  > "I quit my corporate job after parental leave (I was undiagnosed back then) and went self-employed. I’m working 100% remotely and doing around 32hrs a week and I still ended up in burnout before my diagnosis and meds." (u/lacrima28, 1kwnh0u)

---

## 4. HOT + UNSOLVED: top 3 with evidence

### 4.1 #1 (hottest unsolved): "The window is too short to get into it"
Fragmented time breaks the only way her ADHD brain works (deadline sprint / hyperfocus), so the window opens and
she freezes, or starts and gets cut off before she's in.
**Intensity 4 · Unsolved 5 · 16 + 8 threads · all parents.** The only answer people give in comments is "buy more
childcare", and even that fails (babysitters at home are "still noisy", camps the kid hates). Body doubling fails with
kids around. Meds and therapy don't fix it. Nobody in the threads offered a working fix for *starting inside a short,
unpredictable window*.

- > "I need time to get into hyper focus with work, and I don't have enough time do do that. I've had babysitters come to the house, but it's still noisy and distracting and just not the same as the kids being out of the house for a good 6 hour stretch." (OP, 1v5hug7, https://www.reddit.com/r/adhdwomen/comments/1v5hug7/, 4 up; low score, but it's the most exact description in the sample)
- > "Obviously time is limited as a mom in general. And I don’t do well getting things done in a small window of time. It just adds to the overwhelm. ... I’m working with a therapist which has helped with my awareness of issues but I still get so frozen." (OP, small-business owner + breadwinner, https://www.reddit.com/r/workingmoms/comments/1mf9rwo/, 6 up)
- > "Their nap times were like torture for me. Because I think every single nap time they had, I immediately went into that analysis paralysis." / "Do I have 20 minutes? Do I have 40 minutes?" / "You have no idea how much time you're going to have." (ADHD mom, Understood.org "ADHD Aha!" episode, https://www.understood.org/en/podcasts/adhd-aha/analysis-paralysis-exhaustion-adhd-story)
- > "I have 3 hours before I have to do pick up again and I physically can’t motivate myself" / "practically staring at the clock waiting to go and pick my child up" (WoesFromAuntFlo, sole trader with a 3-year-old, Mumsnet AIBU, 7 Sep 2026, https://www.mumsnet.com/talk/am_i_being_unreasonable/5575745-aibu-to-feel-mentally-paralysed-and-unable-to-work)
- > "Mine are 5 and 2 and yeah it is just wait mode and 'being angry at myself for being in wait mode' mode. If anyone has a solution I'd love to hear it 😆" (u/lolajuniper, 8 up, https://www.reddit.com/r/adhdwomen/comments/1vrk88d/). No solution was given in the thread.
- > "Short answer - yes you are kidding yourself. ... I get 2.5 ish hours a day where he's asleep, but the rest of the time I can get a couple of minutes here and there to do things, but it's not really any length of time to be productive." (u/Spirited-Cucumber, **803 up**, https://www.reddit.com/r/Mommit/comments/rqpn1j/)
- > "Even when this part is over, my kid wants my attention every five minutes. I can't follow a thought." (OP, https://www.reddit.com/r/adhdwomen/comments/flbs1z/)
- The rescue move is gone: > "Last-minute energy has always been my saving grace, too. But I was always afraid that well would run dry someday, and I guess it finally has. It's now 3:44pm and I still haven't approached those tasks." (u/bartlebythesniveler, freelancer, https://www.reddit.com/r/adhdwomen/comments/guouby/)
- > "I procrastinate at work, can’t concentrate, then have to catch up at night, so sometimes I sleep like 3-4 hours." (OP, mom of 2, https://www.reddit.com/r/adhdwomen/comments/1liiobu/)

### 4.2 #2: Client ghosting / deadline-slip spiral (freelancer-specific)
**Intensity 5 · Unsolved 4 · 12 threads; it comes up in 45% of the self-employed threads.** It costs money and
reputation directly, and the shame makes it worse ("too ashamed to open my inbox"). The comments do contain some
partial fixes (fake earlier deadlines, weekly client update emails, "10% day" plans), but posters say their tricks stop
working and they keep losing clients.

- > "I woke up at 4am this morning to finish a set of tasks I was supposed to have done Friday, when I instead basically ghosted my clients after realizing I was too worked up with anxiety to be able to cope. I said I'd do it over the weekend, I didn't; on Sunday night, I resolved to do it in the morning; It's 10:16am and I still haven't started." (OP, 79 up, https://www.reddit.com/r/adhdwomen/comments/guouby/)
  Same OP on tools: > "I keep a planner, make lists, set timers. Except when I don't, and it all spirals out of control. My life has fallen apart several times over this. I've lost jobs, opportunities, projects, clients"
- > "I work freelance with 0 security in a competitive area and I'm failing every possible deadline and project right now (the flexibility of freelance creates perfect conditions for procrastination)." (pregnant freelancer, https://www.reddit.com/r/adhdwomen/comments/17oiozd/)
- > "procrastinate communicating with the client out of fear" ... "The idea of having someone commission me for work and then me failing to deliver because I am struggling with ADHD related problems makes me terrified to get started." (mom, closed her Etsy shop, https://www.reddit.com/r/adhdwomen/comments/pjry82/)
- > "for years a bad brain day had two options: force a full workday and produce rubbish, or vanish completely and spend the next three days too ashamed to open my inbox. Both cost me clients." (OP, 114 up, https://www.reddit.com/r/freelance/comments/1uvnflo/)
- > "I am LITERALLY the embodiment of “flakey contractor that we deal with because the work is good in the end.” Lol. I hate it about myself" (u/sacredtones, 28 up, https://www.reddit.com/r/freelanceWriters/comments/1c6gbdv/)
- > "I hate having to face the repercussions of dropping the ball due to avoidance or decision fatigue. It fills me with shame and disappointment. ... I know I’m capable of completing the task or project successfully and avoiding it feels like a dark cloud over my head but I still struggle to start." (u/Expensive_Soup4498, 15 up, https://www.reddit.com/r/ADHD/comments/1mbq61l/)
- Another person's deadline works, her own doesn't: > "the overwhelming shame I feel when I can’t come through for a client. I can’t feel that for deadlines for myself. Never have." (u/BlackCatTelevision, business owner, https://www.reddit.com/r/adhdwomen/comments/1i20wb5/)

### 4.3 #3: Breadwinner on an unreliable brain (income fear)
**Intensity 5 · Unsolved 3 · 20 threads (32%), 17 of them parents.** This is the hottest emotion in the sample: fear of
losing the house, health insurance or the marriage. People treat it as structural (budget, partner, childcare), so
nobody asks for a tool for it. It is what turns #1 and #2 from annoying into frightening.

- > "I’m supposed to be the breadwinner in my family but I feel like I’m just failing as we are just getting more and more in debt. ... my business is failing, revenue has dropped significantly the last year. I know I am great at what I do - I just need to do it." (OP, https://www.reddit.com/r/workingmoms/comments/1mf9rwo/)
- > "I struggle with adhd, and am the sole financial supporter of our household as a 1 person business operation. i am trying to not lose all my clients and be late on my work and show up to my meetings without tear tracks down my face" (OP, 200 up, https://www.reddit.com/r/adhdwomen/comments/1ss0r0d/)
- > "If I quit then we have no money and no health insurance." (u/Amythecoffeequeen, 40 up, same thread)
- > "I make $15000/month and have $25,000 in credit card debt" (OP, ADHD therapist-coach who owns 2 businesses, 402 up, https://www.reddit.com/r/adhdwomen/comments/1i20wb5/)
- > "I have constant anxiety about whether or not I’m going to continue to make good money. My husband and I did $200k combined (after expenses) last year and we still cannot afford to get out of this fucking apartment." (OP, both self-employed, 39 up, https://www.reddit.com/r/workingmoms/comments/1s20xmr/)
- > "I girlbossed too close to the sun and became the breadwinner. I have remote flexibility, a very involved husband and I’m STILL drowning !" (OP, 27 up, https://www.reddit.com/r/adhdwomen/comments/1kwnh0u/)
- > "I am freelance so don't even get a salary." / "I have done nothing this morning apart from send two emails" (Freetodowhatiwant, single mum, Mumsnet, 19 Jul 2023, https://www.mumsnet.com/talk/_chat/4852597-i-just-cant-get-stuff-done)

---

## 5. What they already tried, and why it failed

| Tried | Evidence (verbatim) | Why it failed / partial |
|---|---|---|
| **Planners, lists, timers** | "I keep a planner, make lists, set timers. Except when I don't, and it all spirals out of control." (guouby) · "I've tried lists, rewards, calendars, reminders, alarms. My ability to ignore any of those and play something instead is STRONG." (OP, **6,039 up**, https://www.reddit.com/r/ADHD/comments/1hvak28/) | They record the task but don't get her to do it. They get ignored once the novelty wears off. |
| **Time blocking** | "I am absolutely going to start this right now and then only use it for like 3 days" (u/ReluctantRedditPost, 224 up, 1jk15k0) | Novelty decay. A block plan breaks the first time a kid interrupts. |
| **Productivity apps** | "Apps are only half effective for me. My sister loves finch, but for me it's just another notification that pops up that I don't do..." (u/Blue_Mandala_, 1hrxzzm) · Finch paid: "I use the paid version because it's not super expensive." (u/Tuyyo12345) · "I was looking around today for a to do list or planner or some type of support for ADHD specifically but gosh darn it if I haven't found myself down all these different rabbit holes over the past two hours" (solo-entrepreneur mom of 3, https://www.reddit.com/r/adhdwomen/comments/1dcx6kn/) | One more notification to ignore. Searching for the right tool becomes its own procrastination. Toggl is "very unintuitive" (npzhba). |
| **Smart watch + reminders** | "I purchased a smart watch to pair with my phone to remind me of everything ... it only works about 70% of the time." (u/Lady_Teio, SAHM of 4 + business owner, 1hr5lga) | Helps with remembering, not with starting. |
| **Body doubling** | "parent mode does not work for body doubling" (u/AngerPancake, 1vrk88d) · "I don't think body doubling works with small children at all." (u/JustMeLurkingAround-, 1vrk88d) · Focusmate "a complete game changer" (Mumsnet WFH thread 4665286, non-mom) | Kids at home are not a body double, they're the interruption. Body-double calls clash with kid noise and an unpredictable schedule. |
| **Medication** | "Honestly, I am medicated and still feel like I am raw dogging it lol" (178 up, 1kwap1a) · "It’s a daily gamble if my adderall is even gonna work." (1kwnh0u) · "I take 10-15mg of adderall most days and it definitely makes my anxiety worse but it’s the only way I can get any work at all done." (1mf9rwo) · breastfeeding blocks meds (1gyxuke) | Most commenters call meds the biggest single help. The limits: breastfeeding / pregnancy, hormonal cycle, anxiety side effects, and meds don't create time. |
| **Therapy** | "I had 2 years of therapy and worked on myself so much and nothing changed in a way that 1 week of medication did." (u/lacrima28, 1liiobu) · "I did several years of therapy and didn't move an inch." (u/skvoha, same thread) | Builds insight but doesn't change daily behaviour. |
| **Paid help (cleaner, nanny, "assistant for myself")** | "It is less than $200/month for regular cleanings that took a huge huge piece off my plate." (1t55nvk) · "paying others to do my executive functioning" (u/Trilliachic, **623 up**, https://www.reddit.com/r/ADHD/comments/prnfcm/) · "I even have an assistant so it's not like I'm forgetting - like you I'm just a procrastinator" (u/Hot-Draft-6935, 1c6gbdv) | Works for the house. Does **not** fix starting the work itself (the assistant quote says so directly). |
| **Childcare / camp / babysitter** | "It’s expensive but I ~need~ to work without distraction." (u/kingsley2016, 1v5hug7) · "She hates every camp because it doesn't cater to her." (OP, 1v5hug7) | Costly, not available on sick days or in summer; a sitter at home still means noise. |
| **Self-imposed early deadlines / client check-ins** | "I set deadlines ahead of my client deadlines. Then I procrastinate on my personal deadline and not my clients." (u/saucypancake, 1fg1hd0) · "I intentionally set tight deadlines with my clients otherwise I’ll literally get nothing done." (u/flightcat91, 1c6gbdv) | The partial fix that works best for freelancers: borrowing someone else's deadline. It needs long blocks to sprint in, which moms don't have. |
| **Coworking / leave the house** | "Get yourself a small shared office or coworking. Yeah it costs money, but your productivity will skyrocket" (u/lowfour, dmwlsj) · "I'm currently going over to my parents and work there a few times a week." (1l8zom9) | Works, but costs money, travel time and childcare. |
| **Coaching** (market price, not paid by posters in this sample) | Executive-function coaching usually runs about $115-265 per hour; ADHD coaching providers claim $300-700+ per month; a mom-business program lists $2,997 (marketing pages via web search, unverified). One commenter: "I have a coach ... After a few years the state dicides that i dont need that kind of help anymore, so i lose the coach and 6 months later my house is a mess" (u/Bromidias83, prnfcm) | Works while the coach is there, stops when they go. Too expensive for most of this avatar. |
| **Self-care rituals** | "I’m trying all the things I am supposed to- napping, baths, face masks, walks, etc, and I am still freaking miserable." (OP, 249 up, https://www.reddit.com/r/workingmoms/comments/g054d5/) | Commenters call them a "bandaid". |

**Willingness to pay (stated):** "Willing to pay a fee for apps and services if it comes with someone vouching for its
effectiveness. But I keep trying to do this on my own and getting nowhere." (https://www.reddit.com/r/ADHDmoms/comments/1hrxzzm/).
What they actually pay for is help that **removes a load** (cleaner, nanny, daycare, camp, meds). In this sample they
pay little for software and churn from it quickly.

---

## 6. Triggers and moments

| Moment | Evidence |
|---|---|
| **The window opens** (nap starts, daycare drop-off, school bus) and she freezes | "every single nap time they had, I immediately went into that analysis paralysis" (Understood) · "Before the baby naps I can’t do anything around the house" (1vrk88d) |
| **Pickup is coming** (window ending, clock-watching) | "I have 3 hours before I have to do pick up again" / "staring at the clock" (Mumsnet 5575745) |
| **"Mom. Mom. Mooom" just as she gets going** | "Mine also does “mom. Mom. Mooom” instead of just stating the issue just as I’m about to lock in 😆" (u/Eli_quo, 1vrk88d) |
| **Kid home sick / daycare closed / germ season** | "they’re nonstop home from daycare/childcare with a bug" (1kwnh0u) · "I can’t sleep thinking about having to do this AGAIN" (isd5l8 title) |
| **Summer break** (her business pauses, his job doesn't) | "now I'm just counting down the weeks until school begins again" (1v5hug7) · "ADHD, kids, summer, and working from home" (1df8umn) |
| **Client email / Outlook notification** | "turn off outlook notifications (I completely get the jump scares)" (u/tannystutu, 1kwap1a) |
| **Sunday night resolution, Monday 10am not started** | guouby OP (above) |
| **Friday deadline that becomes 1-2am Monday** | 1c6gbdv OP |
| **After bedtime**: the only long block, paid for with sleep | "I almost always work at night after our toddler goes to sleep." (u/TheAdventuringOtter, 1wh2vd1) · "I compulsively have to get my 4 hours of "me" time in every night" (mom of 2, 1hvak28) |
| **Partner comes home early / his workday takes priority** | 1ajjtpj (259 up), 1v5hug7 |
| **Bill / utility shut-off text** | "This week both our electricity and water got cut off for failure to pay because I FORGOT." (1x4gsn9) |

---

## 7. Language bank (their own words, verbatim)

1. "where the fuck do I tell my brain to start?" (jess.md, 1kwap1a)
2. "waiting mode" / "'being angry at myself for being in wait mode' mode" (1vrk88d)
3. "the constant anticipation of an unexpected transition" (1vrk88d)
4. "I get an hour or two here or there" (1v5hug7)
5. "I need time to get into hyper focus" (1v5hug7)
6. "counting down the weeks until school begins again" (1v5hug7)
7. "Their nap times were like torture for me" (Understood)
8. "Do I have 20 minutes? Do I have 40 minutes?" (Understood)
9. "I can't follow a thought" (flbs1z)
10. "mom. Mom. Mooom" (1vrk88d)
11. "the flexibility of freelance creates perfect conditions for procrastination" (17oiozd)
12. "basically ghosted my clients" (guouby)
13. "flakey contractor that we deal with because the work is good in the end" (1c6gbdv)
14. "too ashamed to open my inbox" (1uvnflo)
15. "10% days" (1uvnflo)
16. "Last-minute energy has always been my saving grace" / "that well would run dry" (guouby)
17. "I can’t feel that for deadlines for myself. Never have." (1i20wb5)
18. "Too ADHD for 9-to-5, too disorganized for freelance" (1mbq61l title)
19. "I am freelance so don't even get a salary" (Mumsnet)
20. "I have done nothing this morning apart from send two emails" (Mumsnet)
21. "I girlbossed too close to the sun and became the breadwinner" (1kwnh0u)
22. "I am medicated and still feel like I am raw dogging it" (1kwap1a)
23. "If I'm caught up with work, the house is a mess." (1kwap1a)
24. "paying others to do my executive functioning" (prnfcm)
25. "there is no-one here to see what I’m doing" (1l8zom9)
26. "I absolutely need to be watched !" (u/Patient-Peanut-3797, 1l8zom9)
27. "Like a chicken with my head cut off every single day" (1hrxzzm, original: "HOW TO NOT FEEL LIKE A CHICKEN WITH MY HEAD CUT OFF EVERY SINGLE DAY.")
28. "I physically can’t motivate myself" (Mumsnet 5575745)
29. "I'm not coping either." (u/Dramatic_Prior_9298, 1liiobu)
30. "That's like super advanced hard mode for most ADHDers" (on starting a business, 1pyojnt)
31. "Petri dish phase" (u/TilapiaLoins, 1kwnh0u)
32. "goblin brain" (1hvak28)
33. "I just felt like a blob of a person" (jess.md, 1qygcbv)

---

## 8. What this means (product-neutral)

- **The sharpest unsolved need:** *getting into work fast inside a short, unpredictable window, and picking it back up
  after a kid pulls her out.* Nobody in the sample has a fix. The advice given (bigger blocks, more childcare, time
  blocking, body doubling) all assumes time she doesn't have.
- **Freelancer-specific add-on:** a stand-in for "someone else's deadline" and for "someone watching". Freelance moms
  have no boss, and the coping move they relied on (the late-night sprint) no longer fits a life with kids.
- **The cheapest unstuck move is a client touch.** The one community fix that clearly works ("Reply to one client, even
  a single honest line", 1uvnflo) is a tiny first action that stops the shame spiral before the work itself.
- **Framing:** moms name the problem as *time* and *interruptions*, not as *paralysis*. Copy that opens with "you have
  40 minutes and you freeze" will land better than "do you struggle with task paralysis?"
- **Avoid:** "just hire help / time-block / get a sitter" (they've heard it and it costs money), and any line that
  implies her work matters less than her partner's.

---

## 9. Data limits and bias (honest note)

- **Reddit-heavy, US-heavy.** Of the 2,055 posts, 48% come from r/adhdwomen. Non-Reddit sources were thin: Mumsnet
  pages were read through a fetch tool that summarises (quotes kept only where it returned exact text; re-check them
  before using in public creative). Facebook groups, TikTok comments and app-store reviews from moms were **not**
  reachable (TeamBlind returned 402, HealthUnlocked returned 403).
- **The avatar is a small slice of Reddit.** Posts where a mom says she *both* freelances *and* has ADHD are rare; most
  ADHD-mom posts are by employees or SAHMs. The 13 parent + self-employed threads I read are a small base, so read the
  freelancer-specific claims (theme 2, §3c) as strong signals, not proportions.
- **Search "top" returns popular, loosely related posts.** That is why I added 15 relevance-sorted searches and built the
  ranking from the 63 hand-coded threads, not the keyword pass. The keyword pass over-counts "partner" (any mention of a
  husband) and "money".
- **Venting bias.** People post when things are bad. Success stories (which happen less) are under-represented, and
  "nothing works" is over-represented.
- **Low upvotes on the most exact posts.** The most avatar-specific threads (1v5hug7, 1mf9rwo, pjry82) have single-digit
  scores in small communities. High-score evidence (803, 623, 6,039) comes from broader audiences, so it shows the pain
  is common, not that this exact avatar is large.
- **Money data is mostly stated, not measured.** Prices for cleaners ($200/mo) and camps come from single comments;
  coaching prices are vendor marketing.
- **Unverified prior quote:** "I get interrupted about 1 billion times" (jess.md) **was re-found verbatim** this round:
  u/Iridescent_Sapphire in https://www.reddit.com/r/adhdwomen/comments/1urtz9t/ ("is that I get interrupted about 1 billion times."), so it can now be quoted.
