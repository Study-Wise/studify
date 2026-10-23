# Issues created by margo-page in this session

These are the "Needs testing" issues that `margo-page` created in this session. They are listed with their original numbers, title, label and full text so they can be checked against the repo and recreated if they are gone.

The 60 issues from the code audit (#503 to #562) are not listed here. They are tracked in `AUDIT.md`.

All of them used the `Testing Needed` label (originally `testing`). Each one was created after its PR merged.

| Issue | Title | PR |
| --- | --- | --- |
| #419 | Needs testing: Answer-dump sites excluded from Additional Resources | #417 (for #126) |
| #420 | Needs testing: Retry wrong ones on step-by-step quizzes | #418 (for #265) |
| #434 | Needs testing: Generated materials are study material, not homework help | #430 (for #75) |
| #435 | Needs testing: Quiz answers, score and retry done in CSS | #431 (for #263 and #264) |
| #436 | Needs testing: Tutor guides instead of showing the steps | #429 (for #83) |
| #438 | Needs testing: Links to individual messages in a chat | #433 (for #428) |
| #443 | Needs testing: Elapsed timer on generator buttons | #442 (for #287) |
| #444 | Needs testing: Markdown and math render while a chat reply streams | #441 (for #349) |

---

## #419 Needs testing: Answer-dump sites excluded from Additional Resources

Label: Testing Needed

This issue handles the testing portion of #126. The change is in #417. The article and tutorial searches in Additional Resources now exclude answer-dump sites (bartleby, brainly, studyx, askfilo, chegg, coursehero and numerade), and the documentation search also allows OpenStax and MIT OpenCourseWare. It needs a manual check against the real search. Use a test account. See also #403 and #113.

Generate (or regenerate) Additional Resources for a few homework-style topics, for example a math problem, a physics problem and an essay question:

- [ ] No article or tutorial links point to bartleby.com, brainly.com, studyx.com, askfilo.com, chegg.com, coursehero.com or numerade.com
- [ ] The sections still fill up with useful learning links, not noticeably fewer results
- [ ] Videos still come from the allowed learning sites (YouTube, Khan Academy and so on)
- [ ] The documentation section can include OpenStax and MIT OpenCourseWare links when the topic fits
- [ ] Science threads still get PhET simulations
- [ ] Regenerating with feedback text still steers the results

Open a bug for anything that fails.

---

## #420 Needs testing: Retry wrong ones on step-by-step quizzes

Label: Testing Needed

This issue handles the testing portion of #265. The change is in #418, and the quiz behavior was later reworked in #431 (shown and hidden with CSS, with a small script that creates the button and clears the wrong answers). Step-by-step quizzes have a "Retry wrong ones" button, so it appears on every quiz, not only on practice questions. Use a test account. See also #435.

On the practice questions page (interactive mock quiz and problem-solving quiz), and also on a quiz in a chat reply, study guide or reference sheet:

- [ ] The button is hidden until a question has been answered wrongly
- [ ] Answering every question correctly never shows it
- [ ] After a wrong answer, the button shows, with a style that matches the quiz
- [ ] Clicking it resets only the wrongly answered questions (selection, highlighting and explanations) and leaves correct ones as they are
- [ ] The button hides again after the reset, and shows again after another wrong answer
- [ ] There is only ever one button per quiz, including after more chat messages load or the page re-initializes
- [ ] A quiz with several wrong answers resets all of them at once
- [ ] It works in light and dark themes and at mobile width

Open a bug for anything that fails.

---

## #434 Needs testing: Generated materials are study material, not homework help

Label: Testing Needed

This issue handles the testing portion of #75. The change is in #430. The shared prompt for all generated materials now forbids final answers and full worked solutions to the student's own homework problems, and says to use a different problem with different numbers for worked examples. It needs a manual check against the real AI. Use a test account. See also #403.

In a chat where you ask for help with a specific homework-style problem (for example a physics projectile problem with numbers, and an algebra equation), generate each material and read it:

- [ ] Study guide: explains the concepts and methods, with no final answer to your problem
- [ ] Reference sheet: formulas and rules, with no worked answer to your problem
- [ ] Chat summary: summarizes what was discussed without stating the final numbers the tutor held back
- [ ] Practice questions: the questions and answer key use different problems and numbers from yours
- [ ] Flashcards, mind map, webpage, slideshow and infographic do not give away your answer either
- [ ] Worked examples inside the materials use different numbers from your problem
- [ ] Materials still read as useful study material, not empty or evasive
- [ ] Regenerating with feedback text still works

Open a bug for anything that fails.

---

## #435 Needs testing: Quiz answers, score and retry done in CSS

Label: Testing Needed

This issue handles the testing portion of #263 and #264. The change is in #431. Step-by-step quizzes reveal only the picked and correct answers, show a running score, and show "Retry wrong ones", mostly in CSS, with no Check answer button. Use a test account. See also #420.

On the practice questions page (interactive mock quiz and problem-solving quiz), and on a quiz in a chat reply, study guide or reference sheet:

- [ ] Clicking an answer reveals it right away: green if correct, red if wrong
- [ ] Only the picked answer and the correct one are marked, with just their two explanations. Other options stay unmarked
- [ ] Picking a different answer updates the marks and explanations
- [ ] The score ("Score: 2 / 3") appears after the first pick, and counts correct answers out of all the questions
- [ ] The score goes up and down correctly as answers are changed
- [ ] "Retry wrong ones" shows only while a wrong answer is picked, and clearing it resets only the wrong questions
- [ ] After a retry the score updates and the button goes away
- [ ] There is one retry button per quiz, including after more chat messages load
- [ ] It works in light and dark themes, at mobile width, and in Firefox, Chrome and Safari

Open a bug for anything that fails.

---

## #436 Needs testing: Tutor guides instead of showing the steps

Label: Testing Needed

This issue handles the testing portion of #83. The change is in #429. When a student asks the tutor to "show the steps", it now guides them one step at a time instead of giving a worked solution. It needs a manual check against the real AI. Use a test account. See also #404.

In a few modes from different categories (for example Algebra and Physics), ask for help with a problem and then say "show me the steps":

- [ ] The tutor does not give a worked solution or the final answer
- [ ] It asks you to try the first step and post it
- [ ] When you post a step, it says whether it is the right step to take
- [ ] It keeps going one step at a time as you post more steps
- [ ] Asking for the steps a second time still does not give the full worked solution
- [ ] When you post your own steps, it gives feedback on each one
- [ ] A plain concept question is still answered normally, with explanations

Open a bug for anything that fails.

---

## #438 Needs testing: Links to individual messages in a chat

Label: Testing Needed

This issue handles the testing portion of #428. The change is in #433. Every new message now gets a random id saved in the database, rendered on the chat page as `message-<id>`. A chat URL with that in the hash scrolls to and highlights the message. There is no icon or button. Use a test account.

Messages saved before this have no id yet, so they have no link.

- [ ] Send a message in a new chat. After the reply, reload the page and check in dev tools that both messages have an element id like `message-<id>`
- [ ] Open the chat URL with one of those ids in the hash (`/chat/<thread>#message-<id>`) in a new tab. The chat loads, scrolls to that message and highlights it for a few seconds
- [ ] Changing the hash in the address bar of an open chat scrolls to and highlights the new message
- [ ] A hash that matches no message, or an element that is not a message, does nothing
- [ ] The ids are different for every message, and they stay the same after a reload
- [ ] A chat created before this change still loads normally, and its older messages simply have no id
- [ ] A reply to an older chat gets an id, and so does the new user message
- [ ] A public chat opened by another user also scrolls to the linked message
- [ ] A saved thread that has tool calls still shows its tool call log after reload

Open a bug for anything that fails.

---

## #443 Needs testing: Elapsed timer on generator buttons

Label: Testing Needed

This issue handles the testing portion of #287. The change is in #442. While a material generates, its button now counts up, like "Generating… 0:42", on the chat sidebar cards and on the toolbar of each material page. Step text like "Outlining… Writing…" is not included, since the server does not report progress yet (#106). Use a test account. See also #399.

Generate a slow material (for example a webpage or a study guide), and regenerate one that already exists:

- [ ] The button shows the generating label and then counts up every second, like "Generating… 0:05"
- [ ] The count rolls over correctly after a minute (0:59 then 1:00)
- [ ] The timer works on the chat sidebar card and on the toolbar of the material page
- [ ] Regenerating shows the same count-up, with the regenerating label
- [ ] The timer stops and the button goes back to normal when the generation finishes
- [ ] The timer stops and the button is restored when the generation fails (for example by going offline)
- [ ] Starting a second generation after the first finishes starts again from 0:00
- [ ] The button stays disabled while it counts, and the label does not jump around or wrap in a narrow sidebar or at mobile width

Open a bug for anything that fails.

---

## #444 Needs testing: Markdown and math render while a chat reply streams

Label: Testing Needed

This issue handles the testing portion of #349. The change is in #441. While a chat reply streams, the server now renders the reply so far as markdown (at most every 100ms) and the browser typesets the math off screen, then swaps it in, so raw `**` and `$…$` do not show. A formula that is still being written is left out until it is complete. The final server-rendered reply still replaces the streamed one at the end. Use a test account. See also #404.

In a chat, ask for a reply that has formatting and math (for example "explain the quadratic formula with an example, using bold, a list and the formulas"), and watch it while it streams:

- [ ] Bold, italics, lists, headings and code blocks show formatted while the reply streams, with no raw `**` or backticks
- [ ] Inline math (`$…$`) and display math (`$$…$$`) show typeset, not as raw LaTeX, while streaming
- [ ] A formula still being written does not show half a formula or raw LaTeX
- [ ] The text does not flicker or jump badly between updates
- [ ] The chat keeps scrolling to the newest text while it streams
- [ ] When the reply finishes, it looks the same as it did just before it finished, then settles to the final version without a flash
- [ ] After reloading the chat, the saved reply looks the same as the final streamed one
- [ ] A reply that uses a tool (for example search) still shows its tool call log and then the streamed reply
- [ ] A long reply with many formulas stays smooth
- [ ] It works in light and dark themes, at mobile width, and in Firefox, Chrome and Safari

Open a bug for anything that fails.
