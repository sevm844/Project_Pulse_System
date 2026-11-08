# Project Pulse: user acceptance testing checklists

Thank you for testing the system. It takes about 20 to 30 minutes.

**How to test**

1. Log in with the email for your role (below) and the password your facilitator gave you.
2. Go through the tasks for your role. Try them as you would in real life, and do not worry about breaking something: this is
   demo data.
3. If something is broken, confusing or great, press **Feedback** (top right of every page) and tell us. It records the page you were on.
4. Mark each task: **✔** worked and was clear, **~** worked but was confusing, **✘** did not work.
5. At the end, press **Feedback → Rate the system** and answer the ten statements.

---

## Student

Emails: `uat-student1@uat.test` (Alpha leader), `uat-student4@uat.test` (Beta), `uat-student6@uat.test` (Gamma), `uat-student7@uat.test` (Delta)

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. On the dashboard, find which phase your group is in and what to do next. | | |
| 2 | Open **Requirements**. Find the **Title Proposal** and read your adviser's instructions. | | |
| 3 | (Student 1) Propose a new title for your group. See it appear in your list as "Pending". | | |
| 4 | (Student 1) Open **Chapter 1 draft**. Try to upload a file that is *not* allowed (for example a picture). Read the message. | | |
| 5 | (Student 1) Upload a PDF for Chapter 1 draft. See the status change to "Under review". | | |
| 6 | Open **Documents**. Preview your PDF, then download it. | | |
| 7 | (Student 7) Open **System architecture diagram**. Read your adviser's remarks and send a new link. | | |
| 8 | (Student 6) Open **Defense**. Find the date, time, room and panel of your proposal defense. | | |
| 9 | Open **Chat** and send a message to your group or your adviser. | | |
| 10 | Open **Notifications**. Can you tell what each one is about, and open it? | | |
| 11 | Open **My Project** and find your team members. | | |
| 12 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## Adviser

Emails: `uat-adviser1@uat.test` (groups Alpha and Beta), `uat-adviser2@uat.test` (groups Gamma and Delta)

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. On the dashboard, see where each of your groups is. | | |
| 2 | Open **Requirements → Title Proposal**. (Adviser 1) Approve one title, ask for changes on another, reject a third. | | |
| 3 | (Adviser 1) Send **UAT Beta** to the Dean once it is ready. If it is already with the Dean, see where that shows. | | |
| 4 | Edit the Title Proposal: write your own instructions and choose which sections it is for. | | |
| 5 | Create a **new requirement**: give it a title, instructions, a due date and one section only. | | |
| 6 | In the same form, limit the file types to PDF only, set a size limit and attach a template file. | | |
| 7 | (Adviser 2) Open **System architecture diagram** and **Final manuscript**. Review a submission: approve or ask for revision. | | |
| 8 | Open **Documents**. Find a student's file and preview it. | | |
| 9 | Open **Assigned Groups**. See each group's members and phase. Try the "Make leader" action on a group. | | |
| 10 | (Adviser 2) Open **Defense** and look at how you would schedule the next defense for UAT Delta. | | |
| 11 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## Dean

Email: `uat-dean@uat.test`

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. On **Projects**, find what needs your attention. | | |
| 2 | Open **UAT Beta**. Read the approved titles. Either sign off with notes, or **return it to the adviser** with a note. | | |
| 3 | On a project's page, find the overall progress through all phases. | | |
| 4 | Open **Defenses**. After the panelists evaluate UAT Gamma, record the result. | | |
| 5 | Open **Requirements** and **Documents** and look through what groups submitted. | | |
| 6 | Open **Administration → Users**. Find a demo account. | | |
| 7 | Open **Administration → Audit Logs**. Find what happened today. | | |
| 8 | Open **Reports**. Can you find a list of all groups and their stage? | | |
| 9 | Open **Feedback**. Read what testers sent and mark one as Resolved. | | |
| 10 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## Panelist

Emails: `uat-panelist1@uat.test` (chair), `uat-panelist2@uat.test`, `uat-panelist3@uat.test`

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. Find the defense you are assigned to (UAT Gamma, today). | | |
| 2 | Click the defense to open it. Read one of the group's approved documents. | | |
| 3 | Fill in and submit your evaluation. | | |
| 4 | Change your evaluation and save it again. | | |
| 5 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## Grammarian

Email: `uat-grammarian@uat.test`

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. Open the **review queue** and find the Final manuscript. | | |
| 2 | Open the document. Approve it, or ask for fixes with remarks. | | |
| 3 | Check that the group would see your remarks. | | |
| 4 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## Research Coordinator

Email: `uat-coordinator@uat.test`

| # | Task | Result | Notes |
|---|---|---|---|
| 1 | Log in. Find the **Final poster** waiting to be received. | | |
| 2 | Mark it as received. | | |
| 3 | Open **Group Folders** and find UAT Delta's record. | | |
| 4 | Open **Student Approvals** and **Archive Records**. Can you tell what each is for? | | |
| 5 | Press **Feedback** and send one message. Then answer **Rate the system**. | | |

---

## For the facilitator

- Before: `php artisan uat:seed` (see `docs/UAT.md` in the backend project). Hand out the right email to each tester.
- After: the Dean's **Feedback** page shows every message and the usability score. Save it, then `php artisan uat:reset`.
