## Goal

Two related features:
1. **Improve the existing `/faq` page** — categorized, searchable, with "Was this helpful?" voting.
2. **Add a new `/quiz` feature** — admin-managed multiple-choice questions, scored attempts, public leaderboard.

---

## 1. FAQ improvements (existing `faqs` table)

Frontend-only changes to `src/pages/Faq.tsx`:

- Search box that filters by question + answer text.
- Category tabs/pills (uses existing `category` column).
- "Was this helpful? 👍 / 👎" buttons on each FAQ.
- Anonymous-friendly vote storage in a new lightweight table `faq_votes` (one row per visitor per FAQ, dedup by `auth.uid()` for signed-in users or a localStorage-generated `voter_key` for anon).
- Show helpful count + percentage under each answer.
- Sort options: Most helpful / Newest / Default order.

New table:
- `faq_votes` — `faq_id`, `user_id` (nullable), `voter_key` (text, nullable), `vote` (`helpful` | `not_helpful`), `created_at`. Unique on `(faq_id, coalesce(user_id::text, voter_key))`. Anon INSERT allowed; SELECT public for aggregate counts via a view.

---

## 2. Quiz system (new)

### Pages
- `/quiz` — list of available quizzes (cards: title, # questions, your best score, global top score).
- `/quiz/:slug` — take the quiz (one question per screen, progress bar, timer optional).
- `/quiz/:slug/result/:attemptId` — show score, correct/incorrect breakdown, share button, link to leaderboard.
- `/quiz/:slug/leaderboard` — top 50 attempts, ranked by score then time.

### Admin tab `/admin?tab=quizzes`
- List quizzes → create/edit/delete.
- Quiz editor: title, slug, description, category, passing score %, time limit (optional), published toggle, randomize questions toggle.
- Question editor within quiz: question text, 2–6 answer options, mark correct answer(s), optional explanation shown after answering, points value.

### New tables
- `quizzes` — `id`, `slug` (unique), `title`, `description`, `category`, `passing_score` (int %), `time_limit_seconds` (nullable), `randomize`, `published`, `created_by`, `created_at`, `updated_at`.
- `quiz_questions` — `id`, `quiz_id` (FK), `prompt`, `explanation` (nullable), `points` (default 1), `sort_order`.
- `quiz_options` — `id`, `question_id` (FK), `label`, `is_correct`, `sort_order`.
- `quiz_attempts` — `id`, `quiz_id`, `user_id`, `score` (int), `max_score` (int), `percent` (numeric), `duration_seconds`, `passed` (bool), `answers` (jsonb snapshot: `[{ question_id, option_id, correct }]`), `created_at`.

### RLS
- `quizzes`, `quiz_questions`, `quiz_options`: anon + auth SELECT where quiz is `published`; admins/owners full access.
- `quiz_attempts`: user INSERT own; user SELECT own; admins SELECT all. Leaderboard reads via a `SECURITY DEFINER` function `get_quiz_leaderboard(slug, limit)` that returns aggregated rows (rank, display_name, avatar_url, percent, duration_seconds) — no direct table grants needed for leaderboard reads.

### Scoring
- Best attempt per user counts for leaderboard.
- Tiebreak: higher percent → shorter duration → earlier created_at.
- Server-side score validation: a `submit_quiz_attempt(quiz_id, answers jsonb, duration int)` `SECURITY DEFINER` function recomputes the score from `quiz_options.is_correct` so clients can't cheat.

### Sidebar
- Add "FAQ" already exists. Add "Quiz" link under Community section in `AppSidebar`.

---

## Files

- `supabase/migrations/<ts>_faq_votes_and_quiz.sql` — new tables + GRANTs + RLS + the two SECURITY DEFINER functions.
- `src/pages/Faq.tsx` — edit (search, categories, voting, sorting).
- `src/pages/Quiz.tsx` (list), `QuizTake.tsx`, `QuizResult.tsx`, `QuizLeaderboard.tsx` — new.
- `src/components/admin/QuizAdminSection.tsx` — new (quiz + question + option editor).
- `src/pages/Admin.tsx` — register the new "Quizzes" tab.
- `src/components/site/AppSidebar.tsx` — add "Quiz" link.
- `src/App.tsx` — register 4 new routes.

---

## Out of scope (ask before adding)

- Reward integration (Discord role / in-game rank on passing) — easy to bolt on later via existing `website-log-event` webhook.
- Multi-correct-answer scoring (partial credit) — current plan: question is correct only if the chosen option matches.
- Anti-cheat beyond server recompute (no IP/device throttling).

Approve and I'll build it.
