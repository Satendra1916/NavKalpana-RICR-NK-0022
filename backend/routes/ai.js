const router = require("express").Router();

// ✅ Career Path (mock for now)
router.post("/career", async (req, res) => {
  const profile = req.body?.profile || {};

  const skills = profile.skills || ["Java", "JavaScript", "SQL", "Web Basics"];
  const education = profile.education || "B.Tech (CSE) student";
  const projects = profile.projects || ["Basic web + auth project"];
  const interests = profile.interests || ["Backend", "Full-stack"];

  const result = {
    recommendedRoles: [
      {
        name: "Backend Developer (Java / Spring Boot)",
        description: "Build APIs, auth, databases, scalable backend services.",
        whyFits:
          "You already know Java, SQL, and you’re building real web app flows (auth + dashboard). Backend fits India job market well.",
        fitScore: 86,
      },
      {
        name: "Full-Stack Developer (Next.js + Node.js)",
        description: "Build complete apps: UI + APIs + database + deployment.",
        whyFits:
          "You’re already using Next.js and Node/Express in AI-CAREER-COACH.",
        fitScore: 82,
      },
      {
        name: "Software Engineer (DSA + Projects)",
        description: "General SDE track: strong CS + DSA + projects.",
        whyFits:
          "You’re learning DSA and doing projects. This opens more companies.",
        fitScore: 78,
      },
    ],

    skillGapAnalysis: {
      alreadyHas: [
        ...skills,
        "Basic Auth flow understanding",
        "Basic REST concepts",
      ],
      missingByRole: {
        "Backend Developer (Java / Spring Boot)": [
          "Spring Boot deep (MVC, Security, JPA/Hibernate)",
          "API design + validation",
          "Caching basics (Redis concept)",
          "Deployment basics",
        ],
        "Full-Stack Developer (Next.js + Node.js)": [
          "State management patterns",
          "Database modeling",
          "Deployment + env management",
        ],
        "Software Engineer (DSA + Projects)": [
          "150–300 DSA questions practice",
          "OOP + SOLID",
          "System Design basics",
          "Computer Networks / OS revision",
        ],
      },
    },

    roadmap: {
      "3months": [
        { task: "DSA foundations", weeklyHours: 8 },
        { task: "Java OOP mastery", weeklyHours: 5 },
        { task: "Build 1 REST project", weeklyHours: 6 },
        { task: "Git + README polish", weeklyHours: 2 },
      ],
      "6months": [
        { task: "2 solid projects", weeklyHours: 8 },
        { task: "Spring Boot + DB integration", weeklyHours: 6 },
        { task: "Internship/job applications weekly", weeklyHours: 3 },
        { task: "Interview prep", weeklyHours: 4 },
      ],
      "12months": [
        { task: "System design basics", weeklyHours: 5 },
        { task: "DSA target 250+", weeklyHours: 8 },
        { task: "Networking + referrals", weeklyHours: 3 },
        { task: "Target companies apply cycle", weeklyHours: 3 },
      ],
    },

    resources: [
      { skill: "DSA", types: ["coding practice platforms", "topic sheets"] },
      { skill: "Spring Boot", types: ["official docs", "security guide"] },
      { skill: "Full-stack", types: ["Next.js docs", "deployment guides"] },
      { skill: "Interview", types: ["mock interview sets", "SQL question sets"] },
    ],

    checkpoints: [
      "Build and deploy 2 full-stack apps",
      "Solve 150 DSA questions",
      "Complete 10 mock interviews",
      "Prepare Backend + Full-stack resumes",
    ],
  };

  return res.json(result);
});

module.exports = router;