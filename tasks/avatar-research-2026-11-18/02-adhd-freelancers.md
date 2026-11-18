# Avatar research 02: Freelancers / solopreneurs / self-employed with ADHD

Researched 2026-11-18. Product-neutral: the research was done without reference to FOCO. Any gender, parents and non-parents.
The raw JSON, coding scripts and dumps are in the session scratchpad (`avatar-freelancers/`). They are not durable.

---

## 1. Sample

| Item | Count |
|---|---|
| Reddit search queries run | 43 (30 + 13), across 18 subreddits |
| Subreddits | ADHD, adhdwomen, ADHDers, ADHD_Programmers, freelance, freelanceWriters, Entrepreneur, smallbusiness, Solopreneur, digitalnomad, graphic_design, webdev, copywriting, VirtualAssistant, selfemployed (+ adhd_anxiety, which returned nothing usable) |
| Unique posts collected | **1,343** |
| Avatar-relevant posts (strict filter: the poster self-identifies as freelance, self-employed, business owner or contractor, AND the post has ADHD context) | **402** |
| Full threads read with comments (up to 40 comments each) | **86** Reddit threads (all hand-coded) |
| Non-Reddit threads read | 4 Hacker News "Ask HN" threads (incl. #16411662, 802 pts / 369 comments), 1 founder essay (Andrew Askins), plus ADDA/ADDitude/CHADD snippets via search |
| Blocked sources | Indie Hackers, HealthUnlocked and the Upwork community returned 403 or redirects. App-store review search for "freelanc" in Tiimo, Structured and Todoist returned 0 reviews |

Subreddit mix of the 402 relevant posts: r/ADHD 169, r/adhdwomen 100, r/ADHD_Programmers 33, r/freelanceWriters 23, r/ADHDers 15, r/smallbusiness 15, then 4 to 8 each from Entrepreneur, graphic_design, Solopreneur, freelance, webdev, copywriting, digitalnomad, VirtualAssistant, selfemployed.

**Two coding passes:**
- (a) Hand-coding of all 86 threads I read, with a primary theme plus secondaries. This pass drives the ranking.
- (b) Regex coding of the 402-post corpus, used as a cross-check. It over-counts money (the word "money" is everywhere) and under-counts initiation (people describe it in many different words).

---

## 2. Ranked pain themes (rubric)

Frequency = share of the 86 hand-coded threads in which the theme appears (primary or secondary). "Corpus %" is the regex share of the 402 posts. Intensity and Unsolved are scored 1-5. Top score = the highest post upvote among threads coded to that theme.

| # | Theme | Threads (%) | Primary in | Corpus % | Intensity | Unsolved | Money signal | Top score |
|---|---|---|---|---|---|---|---|---|
| 1 | **Self-start with no external structure** ("I'm my own boss and I don't respect the boss"): work with no deadline never starts, and the day dissolves | 36 (42%) | 26 | 29% | 4 | **5** | Rented offices, coworking, Focusmate/Flow Club, ADHD coaches ("pricey"), paying a VA *to make them work*, meds, planners, timers | 347 (thread) |
| 2 | **Late, then shame, then ghost spiral**: procrastinating to the deadline, missing it, then avoiding the client's email or call out of shame (themes D+G merged) | 23 (27%) | 17 | 22% + 14% | **5** | 4 | Hypnotherapist, meds, VAs to answer email, "lost probably $100k" | 469 / 370 |
| 3 | **Admin and money tasks**: invoicing, chasing payment, taxes, bookkeeping | 22 (26%) | 8 | 11% | 4 | 2-3 (solved by paying, if they can) | Strongest paid category: CPA, bookkeeper, TurboTax/H&R Block, VA $30-50/hr US or $500/wk offshore, Fiverr $20 | 570 |
| 4 | **Money instability / feast-famine / debt** | 17 (20%) | 4 | 42% (inflated) | 5 | 3 | Family bailouts ($10k/$20k/$25k), credit counselling, inherited IRA drawdown | 570 |
| 5 | **Identity trap**: "too ADHD for 9-5, too disorganized for freelance" | 13 (15%) | 11 | n/a | 5 | **5** | Low (therapy, career change) | **879** |
| 6 | **Marketing / prospecting / selling yourself** (pitching, networking, phone calls) | 12 (14%) | 3 | 18% | 3-4 | 4 | ADHD coach, business coach, mentor | 507 |
| 7 | **Overcommit, then burnout**: saying yes to everything, can't stop, 2-3am work | 12 (14%) | 4 | 18% | 4 | 3 | Raising prices, outsourcing, meal services, cleaners | 879 |
| 8 | **Overwhelm / forgetting commitments** (100 messages, "0 memory of yesterday") | 8 (9%) | 5 | 19% | 3 | 2 (secretary) | Secretary/VA, Motion app | 570 |
| 9 | **Time estimation and pricing** (time blindness, so they undercharge) | 7 (8%) | 4 | 6% | 3 | 3 | Timeular, Toggl, Clockify, ManicTime | 163 |
| 10 | **Interest drop / unfinished projects** (70% done, then a shiny new project) | 7 (8%) | 3 | 11% | 3 | 4 | Little | 547 |
| 11 | Isolation | 1 (1%) | 1 | 8% | 2 | 2 | Coworking, meetups | 38 |

**Reading the table:** themes 1 and 2 are one machine. Work with no deadline never starts (theme 1). Work with a deadline starts too late (theme 2). Being late then produces shame, and the shame silences communication. Admin (theme 3) is mostly theme 1 applied to boring tasks, except that money can buy it out.

---

## 3. HOT + UNSOLVED: top 3, with evidence

### #1. "Things that can be done any time end up being done none of the time"
**Self-start with no external structure. Intensity 4, Unsolved 5, 42% of threads.**

Freelancers with ADHD say the same thing over and over: they can perform under external pressure, and they collapse when they have to direct themselves. The boss they escaped was also their starter motor.

- "I'm my own boss, and I don't respect the boss. What's he going to do, fire me?" ([r/ADHD, 18](https://www.reddit.com/r/ADHD/comments/bzhkgn/freelanceselfemployed_adhders_tips_for_getting/))
- "Personally I could not be my own boss. I know that lady, and she lets me get away with everything." ([comment, 104](https://www.reddit.com/r/ADHD/comments/1wzoy3h/_/pee4eq8/))
- "I'm able to handle incoming clients and issues with well defined deadlines, but things that can be done any time end up being done none of the time." ([r/smallbusiness, 97](https://www.reddit.com/r/smallbusiness/comments/yifbhs/adhd_depression_and_small_business_ownership/))
- "The freedom can quickly turn into paralysis... bouncing between hyperfocusing on the 'wrong' things and being completely unable to start the 'right' things." ([r/ADHD, 38](https://www.reddit.com/r/ADHD/comments/1jowmva/adhders_that_work_from_home_freelancers_how_are/))
- "I work on my own (self-employed). I can work any hours I want. I just. can't. start." ([r/adhdwomen, 112](https://www.reddit.com/r/adhdwomen/comments/123m6j8/i_should_be_working_right_now_and_i_just_cant/))
- "I'd literally die for my business. But...I just can't start. My brain won't turn on." ([r/ADHD, 46](https://www.reddit.com/r/ADHD/comments/1goj579/im_a_freelancer_and_my_procrastination_is_ruining/))
- "I will sit in my car for 12 hours because of the extreme resistance I have to getting out of my car and starting to work. I also know that once I'm out of my car and working I'll be fine." This is a six-figure self-employed salesperson. ([r/ADHD, 11](https://www.reddit.com/r/ADHD/comments/1flkba7/selfemployed_unable_to_make_myself_go_to_work/))
- "Self employment is no one following up, no one holding you accountable... All things people with ADHD are *diagnosably* bad at." ([comment, 8](https://www.reddit.com/r/ADHD/comments/1v3eaf6/_/oz2ev78/))
- On Hacker News, a freelancer wrote: "I've used everything from rewards... to punishment... I come up with a new tactic to motivate myself every couple of months." ([Ask HN #16411662, 802 pts](https://news.ycombinator.com/item?id=16411662))

**Why it is unsolved:**
- The top advice in these threads is "pomodoro, planner, schedule, alarms", and posters explicitly report that these fail: "set a schedule and corresponding alarms, but I find them waaaay to easy to ignore... (Pomodoro was a disaster for me)" ([117](https://www.reddit.com/r/adhdwomen/comments/1hgktvb/for_those_who_wfh_esp_freelance_please_tell_me/)). Another poster writes "I know the Pomodoro method is usually recommended, but it's just not something that works for me" ([14](https://www.reddit.com/r/ADHD/comments/1o0hmuc/adhd_being_a_solo_business_owner/)).
- The other common answer is to rebuild a boss: a mum who phones to "demand the work", a paid VA "to make sure I do my work" ([r/VirtualAssistant](https://www.reddit.com/r/VirtualAssistant/comments/18q8qkn/hiring_somone_to_help_motivate_me_and_make_sure_i/)), or simply going back to employment ("Having a 9-5 boss who can fire me", [22](https://www.reddit.com/r/ADHD/comments/1mdf1zl/selfemployed_people_freelancers_etc_what_are_your/)).
- Meds help some people and not others. "I need pressure to work effectively and efficiently - medication, lifestyle adjustments, therapy, etc do not do for me what actual pressure does." ([99](https://www.reddit.com/r/adhdwomen/comments/1m85e1o/_/n4wqrng/))
- The meta-fatigue is real: "I'm soooo exhausted with all the mental hoops & gymnastics I have to do in order to trick my brain into doing the bare minimum to survive." (quoted in [comment, 7](https://www.reddit.com/r/ADHD/comments/1i09eqq/_/m70p2n1/))

### #2. The late, then shame, then ghost spiral
**Intensity 5, Unsolved 4, 27% of threads. This is the highest-stakes theme: clients, reputation, lawsuits.**

- "Clients are all mad at me (rightly so), one star reviews are rolling in, just got served papers from a client that's suing me, email inbox full of people I've ghosted for weeks, can't remember the last time I answered the phone…all this and I still can't physically make myself do the work that I'm months behind on." ([r/ADHD, 370](https://www.reddit.com/r/ADHD/comments/1furv1x/ive_let_what_was_once_a_wildly_successful/))
- "I am a freelance designer and i've ghosted a client out of pure shame and embarrassment for forgetting to do my actual job for weeks" ([r/adhdwomen, 43](https://www.reddit.com/r/adhdwomen/comments/z7ezkv/i_am_a_freelance_designer_and_ive_ghosted_a/)). A reply: "It just gets more difficult the more time passes." ([4](https://www.reddit.com/r/adhdwomen/comments/z7ezkv/_/iy79et0/))
- "The more I put it off the worse it gets...and the more I avoid because I'm terrified of what I'll find." ([r/ADHD, 198](https://www.reddit.com/r/ADHD/comments/1i09eqq/i_keep_ignoring_my_inbox_and_ghosting_people_via/))
- "I have ruined 23 relationships (close friendships, mentors, clients) because i can't reply back" ([r/ADHD, 469](https://www.reddit.com/r/ADHD/comments/1ewph99/i_have_ruined_23_relationships_close_friendships/))
- "This is now the 5th client where I missed a deadline... No payment. No result. Just exhaustion and regret." ([r/freelance, 163](https://www.reddit.com/r/freelance/comments/1lf5yyo/i_keep_missing_deadlines_its_the_5th_client_now/))
- "I've missed out on probably $100k worth of opportunities due to my mental health." ([r/ADHD, 26](https://www.reddit.com/r/ADHD/comments/1hiixuo/i_messed_up_so_many_great_opportunities_advice/))
- "I am LITERALLY the embodiment of 'flakey contractor that we deal with because the work is good in the end.'" ([28](https://www.reddit.com/r/freelanceWriters/comments/1c6gbdv/_/l00s5zc/))
- "It took 2 hours, but I've been procrastinating and feeling guilty ALL DAMN WEEKEND. All that stress for just 2 bloody hours." ([3](https://www.reddit.com/r/ADHD/comments/1goj579/_/lwm4807/))

**Why it is unsolved.** The usual fix for theme #1 is external accountability, and here it fails because **clients already are that accountability**. One commenter put it exactly: "you already have external accountability in the form of clients, and already struggle to keep commitments and deadlines with them" ([3](https://www.reddit.com/r/ADHD/comments/3m6xwg/_/cvctbam/)). Once someone is late, the accountability turns into a threat, and the response to a threat is avoidance.

Advice in these threads splits into three kinds:
- Blunt: "freelancing may not be for you" (124 upvotes on [1lf5yyo](https://www.reddit.com/r/freelance/comments/1lf5yyo/i_keep_missing_deadlines_its_the_5th_client_now/))
- Contractual: scope clauses
- Hacks: "scary hour" ([119](https://www.reddit.com/r/ADHD/comments/1i09eqq/_/m6wlpgs/))

Only one post describes a pattern that actually broke the spiral: a pre-decided "10% day" made of one client touch, logging the money, then stopping ([r/freelance, 119](https://www.reddit.com/r/freelance/comments/1uvnflo/my_10_day_protocol_for_keeping_a_freelance/)). Its author: "a bad brain day had two options: force a full workday and produce rubbish, or vanish completely and spend the next three days too ashamed to open my inbox. Both cost me clients... 9am me isn't allowed to negotiate."

### #3. The identity trap: "too ADHD for 9-5, too disorganized for freelance"
**Intensity 5, Unsolved 5, 15% of threads, highest single upvote count in the sample.**

- "Too ADHD for 9-to-5, too disorganized for freelance… feeling stuck and exhausted... I've tried freelance work too, but my ADHD makes self-management a constant battle. I end up overwhelmed, disorganized, and stuck in cycles of guilt and avoidance." ([r/ADHD, 879 / 99 comments](https://www.reddit.com/r/ADHD/comments/1mbq61l/too_adhd_for_9to5_too_disorganized_for_freelance/))
- "I suck at being employed and I suck at freelancing" ([r/adhdwomen, 32](https://www.reddit.com/r/adhdwomen/comments/1krcikl/i_suck_at_being_employed_and_i_suck_at_freelancing/))
- "I'm now an independent contractor and I don't want that either. There's too many things that always need to be done... I work best alone with instruction." ([9](https://www.reddit.com/r/adhdwomen/comments/11widal/_/jcyef0r/))
- "I would be my own nightmare boss." ([27](https://www.reddit.com/r/adhdwomen/comments/11widal/_/jcy4t3v/))
- "I desperately want to be a freelancer and depend on myself for a living but the trust just isn't there lol." ([5](https://www.reddit.com/r/adhdwomen/comments/12c74cr/_/jf0om51/))

**Why it is unsolved:** the comments offer career-switch suggestions (IT, 12-hour shifts, seasonal work) or "no job will be fulfilling, sucks to suck" (235 upvotes). Nobody offers a way to make self-direction work. The phrase "alone with instruction" is a precise spec for the missing thing: autonomy plus external instruction.

---

## 4. Parent vs non-parent split (and gender)

**Data limit up front:** only **14 of 402** relevant posts (3.5%) carry an explicit parent signal. Among the 86 threads, about 10 OPs or substantive commenters identify as parents. The numbers below are directional only.

| | Parents (n≈14 posts, ~10 thread voices) | Non-parents (the large majority) |
|---|---|---|
| Money pressure | Dominant. 79% of parent posts touch money, vs 40% of non-parents. "my wife & kids want and deserve so much more but i'm in an 'ADHD Shitdown Mode'" ([2](https://www.reddit.com/r/ADHD/comments/1furv1x/_/lqbsl5t/)) | Present, but framed as "one dropped gig away from eviction" ([3](https://www.reddit.com/r/adhdwomen/comments/12c74cr/_/jf1rou7/)) |
| Overwhelm | 43% vs 18% | Lower |
| When work happens | In leftover hours: "I work a standard 8-5, raise two kids, put them to bed and then I work on my own business until 2-3am" ([6](https://www.reddit.com/r/ADHD/comments/1hillqj/_/m2zrpes/)) | The open day itself is the problem (unstructured time, morning drift, "less work = less motivation") |
| Executive-function backstop | A spouse often carries it: "My husband pulls nearly all the executive functioning weight that we don't outsource" ([401](https://www.reddit.com/r/adhdwomen/comments/1i20wb5/peak_into_a_successful_business/)) | Pay for it (VA), or nobody carries it |
| Signature pain | Can't protect the time or the money, guilt toward family | Can't start, the identity trap, isolation |

**Gender:** 108 of 402 posts have a female signal (mostly r/adhdwomen) and 20 have an explicit male signal.
- Female-coded threads skew toward shame/imposter feelings, overcommitting ("said yes to everything", [20](https://www.reddit.com/r/adhdwomen/comments/xxrt10/i_run_my_own_business_and_didnt_realize_my_adhd/)), people-pleasing, and invoice anxiety.
- Male-coded posts skew toward discipline language ("don't respect the boss"), sales resistance (12 hours in the car), and "just hire an assistant" solutions (r/Entrepreneur, 220).
- The core initiation pain is identical across genders.

---

## 5. What they tried and why it failed

| Tried | Share of threads mentioning it | Why it failed (their words) |
|---|---|---|
| Medication | 69% (includes general discussion) | "tried all medications that are available in my country... None of them helped me" ([80](https://www.reddit.com/r/ADHD/comments/1x09vme/procrastination_is_ruining_my_career_finances_and/)). Also "my dr doesn't prescribe stimulants", "Fuck my meds not working anymore" |
| Planners / to-do apps / calendars | 40% | "forget about apps, they're too distracting since they let you list things endlessly" ([5](https://www.reddit.com/r/ADHD/comments/35b2kd/_/cr2tqfv/)). Daily planner: "seeing all the task listed... leave the remaining items to pile... until is unbearable" (3m6xwg) |
| Therapy | 36% | Helps with shame. Doesn't start the work |
| Body doubling / accountability (Focusmate, Flow Club, Twitch coworking) | 36% | Works when used, but "I tried it once and it was good but I feel stupid that I need this" ([3](https://www.reddit.com/r/ADHD/comments/1jowmva/_/mkv1l7q/)). People stop using it: "a tip that im not using atm... I used the focusmate page a lot" |
| VA / assistant / secretary | 29% | Works best of all for admin. Costs $30-50/hr US or $500/wk offshore, which ADHD-damaged income often can't cover: "You can't hire help with lost revenue" ([2](https://www.reddit.com/r/ADHD/comments/1hiixuo/_/m3007ik/)). Also an ethical backlash at $3-5/hr offshore |
| Coworking / renting an office / coffee shop | 29% | Helps them get started. Doesn't fix the work that was never started at home |
| Pomodoro / timers / time trackers | 28% | "Pomodoro was a disaster for me". Time trackers: "I just don't remember to do it" ([1](https://www.reddit.com/r/ADHD/comments/jc6uqn/_/g94bbye/)); "I'll forget to turn it on after a while" (Toggl) |
| Fiverr / Upwork outsourcing | 24% | Good for one-off tasks ($20 drafts). Doesn't help with initiation |
| ADHD / business coach | 22% | "It's pricey, but worth it" ([6](https://www.reddit.com/r/copywriting/comments/1ahnfeb/_/korvjqx/)). Some get trial clients for free. Access is the barrier |
| Bookkeeper / CPA / tax preparer | 17% | Fixes taxes. But "Even when someone else is sending them out, I still have some kind of inner demon that says somehow my work isn't worth paying for" ([44](https://www.reddit.com/r/freelance/comments/2na2qw/how_do_you_deal_with_your_reluctance_to_send_out/)). QuickBooks itself became the barrier: "my third kick at the can... I literally do not load ANYTHING in it" ([6](https://www.reddit.com/r/ADHD/comments/1f9pymg/need_solution_quickbooks_driving_an_adhd/)) |
| Spouse or business partner takes on executive function | 13% | Works, but creates dependency and guilt |
| Hypnotherapy, Motion app, Timeular, ChatGPT for dreaded emails | single mentions | ChatGPT is mentioned specifically for writing the dreaded overdue-invoice or apology email ([11a8f49](https://www.reddit.com/r/ADHD/comments/11a8f49/small_biz_owners_im_45_months_behind_on_some_of/)) |

**Patterns that did work, as reported (rare):**
- **Pre-decided minimums:** the 10% day ([119](https://www.reddit.com/r/freelance/comments/1uvnflo/my_10_day_protocol_for_keeping_a_freelance/)).
- **Robot-level first steps:** "open laptop / open browser / log in / find form" ([139](https://www.reddit.com/r/adhdwomen/comments/1jv8cbg/random_trick_for_my_fellow_adhd_entrepeneurs/)).
- **Internal deadlines ahead of the client's**, and weekly client progress emails.
- **Delegation once revenue allows it.**

What these share: they take the decision out of the moment of starting.

---

## 6. Triggers / moments

- **The morning after coffee:** "Meditating for 10 min and drinking coffee are the two things I'm consistent at, but after that I go time blind" (bzhkgn).
- **Quiet periods with one client:** "having such a light workload makes it even harder to get anything done" ([101](https://www.reddit.com/r/adhdwomen/comments/1m85e1o/freelancers_with_adhd_does_less_work_less_motivation/)); "My theory is that we only have two modes, go and stop" (103).
- **Feedback or revisions arrive** after delivery and the project expands (1lf5yyo, 650xku).
- **A new email or call from a client you're already late with:** the avoidance loop starts here (1i09eqq, z7ezkv, 1oqg0cc: "ive been ghosting them for a year now. Still upsets me when one calls").
- **Invoice day and tax season:** extensions, IRS letters, "4-5 months behind on invoicing" with $12,300 owed (11a8f49).
- **A sudden success or flood of inquiries,** leading to overcommitment (xxrt10) and self-sabotage "right as they start succeeding" (1furv1x).
- **Burnout recovery,** when clients have quietly left: "the clients I had don't 'need me at the moment'" (1mbq61l).
- **Meds wearing off in the afternoon,** or meds not yet started.
- **Prospecting time:** the phone, cold outreach, networking events.
- **Comparison with a neurotypical peer** (18d1ro5: "she just has a list of tasks she wants to do, does them, and relaxes").

---

## 7. Language bank (verbatim phrases)

1. "I'm my own boss, and I don't respect the boss."
2. "I know that lady, and she lets me get away with everything."
3. "I would be my own nightmare boss."
4. "Things that can be done any time end up being done none of the time."
5. "I just. can't. start."
6. "My brain won't turn on."
7. "The freedom can quickly turn into paralysis."
8. "Too ADHD for 9-to-5, too disorganized for freelance."
9. "I work best alone with instruction."
10. "The trust just isn't there."
11. "Stuck in cycles of guilt and avoidance."
12. "Too ashamed to open my inbox."
13. "Terrified of what I'll find."
14. "Ghosted a client out of pure shame and embarrassment."
15. "Flakey contractor that we deal with because the work is good in the end."
16. "All that stress for just 2 bloody hours."
17. "I'd rather fall from the 3rd floor than the penthouse."
18. "ADHD Shitdown Mode."
19. "Money that only exists in my head is money I lose."
20. "Subcontracting for free for no reason." (unsent invoices)
21. "Some kind of inner demon that says somehow my work isn't worth paying for."
22. "One dropped gig away from eviction."
23. "Mental hoops & gymnastics... to trick my brain into doing the bare minimum."
24. "We only have two modes, go and stop."
25. "Clawing anxiety in my chest and the mountain of things I need to get done."
26. "I said yes to everything. Everything."
27. "I need an adult."
28. "0 memory of yesterday's small items."
29. "Sell myself." / "Phone calls are my nemesis."
30. "Living life on hard mode."
31. "I loved the work itself but it's only about 50% of the job."
32. "A recipe for failure." (being my own boss)

---

## 8. Honest data limits

- **The parent sample is tiny** (14 posts, about 10 thread voices). The parent and non-parent comparison is directional only. Parents of young kids who freelance mostly post in mom subreddits under other framings, so a mom-specific researcher will have better data.
- **Regex frequencies are noisy.** "Money" inflates theme 4. Initiation is under-counted because people describe it in many idioms. The ranking relies on the hand-coded 86 threads, and those were chosen by me (biased toward higher-engagement and pain-heavy threads), not randomly sampled.
- **Reddit selection bias:** people post when stuck. Successful ADHD freelancers ("I'm neither focused nor consistent... clients overlook the mess", comment with 51 upvotes in [this thread](https://www.reddit.com/r/adhdwomen/comments/1hp2pip/)) are under-represented.
- **Upvote scores are not comparable across subs:** r/ADHD is about 100x bigger than r/freelance.
- **Time span** is roughly 2015-2026. Older threads predate ChatGPT, Focusmate's growth and the current wave of AI planners.
- **Indie Hackers, HealthUnlocked and the Upwork forums were inaccessible (403).** The App Store review search returned nothing for "freelanc". The non-Reddit evidence is limited to Hacker News plus a founder essay.
- **Gender** was inferred from the subreddit and self-labels. Most posts have no gender signal.
- **Money amounts** are sparse. Only a handful of posts give prices (VA $30-50/hr US or $500/wk offshore, Fiverr $20, a $125 telehealth meds fee). Nobody quoted coach prices beyond "pricey".
