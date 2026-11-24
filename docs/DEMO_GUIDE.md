# Project Pulse: the demo data, explained

Make it with `php artisan uat:seed --password="Passw0rd!x1"` (backend folder). Remove it with `php artisan uat:reset`.
Every account has the same password.

## The idea: five teams, one at each point of the capstone

Open a different team to see a different stage. The students are named by their team.

| Team | Students | Adviser | Where the team is | What to try |
|---|---|---|---|---|
| **Team 1** Title Proposal | Ana (leader), Ben | Santos | One title waits for the adviser | Santos: approve, ask for changes or reject the title |
| **Team 2** Client Consultation | Carla (leader), Dan | Santos | Two titles approved, consultation started | Santos: confirm the one title to defend |
| **Team 3** Proposal Defense | Ella | Cruz | Defense is **today**, panel of three | Panelists: score it. Cruz: record the result |
| **Team 4** Alpha stage | Felix (leader), Gina | Cruz | Passed the Proposal Defense. The manuscript is now the Dean's to read | Dean: read the manuscript, the comment, the decision. Alpha Defense is scheduled |
| **Team 5** Final stage | Jun (leader), Kim | Cruz | All five defenses passed | Grammarian: issue the certificate. Secretary: receive the outputs, then archive |
| No group yet | Hana, Ivan | (none) | Has no group | Santos: add them to a group |

## The people

| Role | Name | Email | Does what |
|---|---|---|---|
| Dean | Dean Reyes | uat-dean@uat.test | Teaches **CAP101-2**. Manuscripts, Alpha to Final defenses, his assignments, similarity, certificates |
| Adviser | Adviser Santos | uat-adviser-santos@uat.test | Teaches **AppDev BSIT 4A**: Teams 1 and 2 |
| Adviser | Adviser Mendoza | uat-adviser-mendoza@uat.test | Technical adviser of Teams 4 and 5: reads their manuscript and the scanned monitoring form, comments |
| Adviser | Adviser Cruz | uat-adviser-cruz@uat.test | Teaches **AppDev BSIT 4B**: Teams 3, 4 and 5 |
| Dean's Secretary | Secretary Lopez | uat-secretary@uat.test | Receives the final outputs, archives |
| Grammarian | Grammarian Diaz | uat-grammarian@uat.test | Checks Team 5's manuscript, issues the certificate |
| Panelists | Ramos (chair), Torres, Bautista | uat-panelist-ramos / -torres / -bautista @uat.test | Team 3's defense today, Team 4's Alpha Defense |
| Students | Ana, Ben, Carla, Dan, Ella, Felix, Gina, Jun, Kim, Hana, Ivan | uat-ana, uat-ben ... uat-ivan @uat.test | See the table above |

## The two lanes

- **The adviser's lane (AppDev)**: her groups, her assignments, the title proposal, the Proposal Defense.
- **The Dean's lane (CAP101-2)**: his assignments (Milestone monitoring form, Final manuscript, Final poster), the manuscript, the later defenses.

## Where each person looks first

- **Adviser Santos:** *Assigned Groups* and *Requirements*.
- **Adviser Cruz:** *Defense* (Team 3 today).
- **Dean Reyes:** *Manuscripts* (Team 4 only: the others have not reached his stage), *Defenses*, *Certificates*.
- **A student:** the dashboard, then Requirements (Assignments, Pending, Completed, Forms), My Project, Defense.
- **Panelists, Grammarian, Secretary:** their own pages; their work belongs to the Dean's lane.

## Capstone and Technical advisers (after the Proposal Defense)

- Team 4 passed its Proposal Defense: **Cruz** (AppDev) named **Santos** as its Capstone adviser and **Mendoza** as its Technical adviser. Team 4 left Cruz's list and sits under *Handled in AppDev* on her Assigned Groups page.
- Team 5: Cruz named herself Capstone adviser and Mendoza Technical adviser, so Team 5 stays in her list.
- Santos and Mendoza have **Manuscripts** in their sidebar: they read Team 4's versions, write comments (labelled Capstone adviser / Technical adviser) and open the scanned Capstone Monitoring Form.
- Felix or Gina (Team 4): *My Project > Capstone Monitoring Form* to hand in the scans; *Manuscript > Share with my advisers*.
