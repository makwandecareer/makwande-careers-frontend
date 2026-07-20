
MAKWANDE CAREERS — UPDATED AI SUITE SIDEBAR

This package is based on the Sidebar code supplied in "Side Bar Coding.docx".

ADDED TO THE SIDEBAR
- ATS Intelligence
- Career Intelligence
- Application Copilot
- Recruiter Simulation
- AI Resume Writer
- Job Matching
- Opportunity Dashboard

ALSO IMPROVED
- Active-page highlighting
- Active workspace highlighting through ?workspace=
- AI and New badges
- Scrollable navigation
- Responsive compact sidebar
- Safer logout handling
- Accessible navigation labels
- Existing career, CV, jobs, employer and account links retained

INSTALL
1. Extract this ZIP outside the frontend repository.
2. Double-click install-sidebar.cmd.
3. The installer searches for the existing Sidebar component and creates a backup.
4. Copy the contents of sidebar-styles.css into the stylesheet where the current
   .sidebar and .side-link rules are stored.
5. Run:

   cd /d E:\Makwande_Careers_Frontend
   npm run build
   npm run dev

IMPORTANT ROUTING NOTE
The new AI links use:
  /dashboard/cv-builder?workspace=ats
  /dashboard/cv-builder?workspace=career
  /dashboard/cv-builder?workspace=copilot
  /dashboard/cv-builder?workspace=recruiter
  /dashboard/cv-builder?workspace=writer
  /dashboard/cv-builder?workspace=matching
  /dashboard/cv-builder?workspace=opportunities

Your CV Builder page should read the "workspace" search parameter and select the
matching internal tab. If it does not yet do this, the links still open the CV
Builder, but the requested tab will need query-parameter integration.

COMMIT
git add .
git commit -m "Add complete AI career suite to dashboard sidebar"
git push origin phase-3-cv-management
