// Generated from research and Gemini skill catalog
export const RESEARCH_METADATA = {
  "research_date": "2026-10-07",
  "geography": "Global",
  "target_roles": [
    "Software Engineering",
    "Frontend",
    "Backend",
    "Full-Stack",
    "Data/Analytics",
    "Cloud/DevOps",
    "Cybersecurity",
    "Mobile",
    "AI/ML"
  ],
  "candidate_level": "students and early-career applicants",
  "time_window": "2025-10-07 to 2026-10-07, with a small number of supplemental 2025 survey sources where newer comparable evidence was unavailable",
  "methodology": "Cross-checked current job-posting datasets, employer/recruiter-oriented hiring research, labor-market and professional-skills reports, technology ecosystem surveys, and recent Reddit discussions. Job-posting percentages are treated as skill mentions rather than guaranteed requirements. Reddit is used only as anecdotal evidence. Global conclusions are weighted toward sources covering multiple countries; US-only posting datasets are labeled as such.",
  "limitations": [
    "There is no single public global dataset covering all nine target role families and all countries consistently.",
    "Current job-posting indexes measure posting mentions, not hires, vacancies filled, or candidate success.",
    "Some indexed datasets have non-random samples or regional coverage limitations.",
    "Technology usage surveys indicate adoption or developer preference, not necessarily hiring demand.",
    "Junior and internship hiring is substantially smaller than overall software hiring, so a broadly popular technology should not automatically become an onboarding requirement.",
    "Professional skills are difficult to assess from a short quiz and should be presented as evidence-based signals rather than objective personality or employability scores."
  ]
};

export const CATEGORIES = [
  {
    "id": "frontend",
    "name": "Frontend",
    "skill_type": "technical",
    "description": "Browser-facing interfaces, web foundations, frameworks, accessibility and frontend performance."
  },
  {
    "id": "backend",
    "name": "Backend",
    "skill_type": "technical",
    "description": "Server-side programming, APIs, application logic, services and backend frameworks."
  },
  {
    "id": "database",
    "name": "Database",
    "skill_type": "technical",
    "description": "Relational and non-relational data storage, querying, modeling and persistence."
  },
  {
    "id": "devops_cloud",
    "name": "DevOps / Cloud",
    "skill_type": "technical",
    "description": "Cloud platforms, containers, CI/CD, infrastructure as code and production operations."
  },
  {
    "id": "programming_language",
    "name": "Programming Language",
    "skill_type": "technical",
    "description": "General-purpose programming languages assessed through practical understanding and problem solving."
  },
  {
    "id": "mobile",
    "name": "Mobile",
    "skill_type": "technical",
    "description": "Android and iOS development technologies."
  },
  {
    "id": "ai_ml",
    "name": "AI / ML",
    "skill_type": "technical",
    "description": "Machine learning, AI systems, model development and AI-assisted engineering."
  },
  {
    "id": "data_analytics",
    "name": "Data / Analytics",
    "skill_type": "technical",
    "description": "Data analysis, statistics, visualization, BI and analytical workflows."
  },
  {
    "id": "cybersecurity",
    "name": "Cybersecurity",
    "skill_type": "technical",
    "description": "Security fundamentals, secure development, cloud security, monitoring and risk."
  },
  {
    "id": "dsa",
    "name": "DSA",
    "skill_type": "technical",
    "description": "Data structures, algorithms, complexity and structured problem solving."
  },
  {
    "id": "testing_qa",
    "name": "Testing / QA",
    "skill_type": "technical",
    "description": "Unit, integration, end-to-end testing, test design and quality practices."
  },
  {
    "id": "tools",
    "name": "Tools",
    "skill_type": "technical",
    "description": "Developer and collaboration tools that support software delivery."
  },
  {
    "id": "professional",
    "name": "Professional",
    "skill_type": "professional",
    "description": "Workplace communication, collaboration, explaining technical work and problem-solving behavior."
  },
  {
    "id": "other",
    "name": "Other",
    "skill_type": "technical",
    "description": "Skills that do not fit the primary catalog categories."
  }
];

export const RECOMMENDED_SKILLS = [
  {
    "id": "python",
    "name": "Python",
    "category_id": "programming_language",
    "skill_type": "technical",
    "relevant_roles": [
      "Software Engineering",
      "Backend",
      "Data/Analytics",
      "AI/ML"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Python",
    "why_it_matters": "Python has very broad coverage across software engineering, backend, data and AI-related work.",
    "evidence_summary": "Python was the most-mentioned skill in the current Apiva software-engineer sample at 45.2% and is also the second-most-mentioned Data Analyst skill at 44.6%.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://kitejobs.ai/reports/data-analyst](https://kitejobs.ai/reports/data-analyst)",
      "[https://www.hackerrank.com/research/developer-skills/ai](https://www.hackerrank.com/research/developer-skills/ai)"
    ],
    "assessment": {
      "purpose": "Measure core Python reading, control flow, collections and debugging rather than syntax memorization.",
      "limitations": [
        "Two questions cannot establish full Python proficiency.",
        "Results should be supplemented by practical project evidence."
      ],
      "questions": [
        {
          "id": "python_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Mutation and list behavior",
          "prompt": "What is printed by: a = [1, 2]; b = a; b.append(3); print(a)?",
          "options": [
            "A. [1, 2]",
            "B. [1, 2, 3]",
            "C. [3]",
            "D. Error"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Award partial credit only if the answer correctly identifies that b refers to the same list but the final output is wrong.",
          "common_misconceptions": [
            "Assignment creates a new list copy.",
            "append() returns a new list."
          ],
          "level_indicators": {
            "beginner": "Understands basic variables but not object references.",
            "developing": "Understands the reference relationship with some uncertainty.",
            "proficient": "Correctly predicts the result and explains shared mutation.",
            "advanced": "Explains references and contrasts assignment with slicing or copy()."
          }
        },
        {
          "id": "python_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Debugging",
          "prompt": "A function should return the maximum value from a non-empty list but sometimes returns None. Explain one plausible bug and how you would test it.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Strong response identifies a missing return path, incorrect indentation or conditional logic and proposes small test cases including one-element, increasing, decreasing and duplicate-value lists.",
          "acceptable_alternatives": [
            "Other technically valid control-flow bugs paired with a sensible test strategy."
          ],
          "partial_credit_guidance": "Give half credit for identifying a plausible bug without a useful test strategy.",
          "common_misconceptions": [
            "Assuming Python automatically returns the last expression."
          ],
          "level_indicators": {
            "beginner": "Suggests testing but gives weak debugging reasoning.",
            "developing": "Identifies a plausible control-flow problem and basic tests.",
            "proficient": "Connects likely bug locations to targeted test cases.",
            "advanced": "Discusses invariants, edge cases and systematic isolation of the failing path."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic syntax/control flow only; needs guided practice.",
        "developing": "Understands common Python patterns but has gaps in debugging or object behavior.",
        "proficient": "Can reason correctly about common Python code and debug ordinary problems.",
        "advanced": "Handles subtle behavior and systematic debugging with strong reasoning."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "javascript",
    "name": "JavaScript",
    "category_id": "programming_language",
    "skill_type": "technical",
    "relevant_roles": [
      "Frontend",
      "Full-Stack",
      "Backend",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "JavaScript",
    "why_it_matters": "JavaScript remains a fundamental web language and appears throughout frontend and full-stack work.",
    "evidence_summary": "Current US frontend postings mention JavaScript in 30.7% of analyzed postings, while software-engineer postings mention it in 12.5%.",
    "sources": [
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Test core JavaScript execution, async behavior and common data manipulation.",
      "limitations": [
        "Does not assess framework-specific expertise.",
        "Does not establish browser-debugging ability."
      ],
      "questions": [
        {
          "id": "javascript_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Scope behavior",
          "prompt": "Which declaration is block-scoped?",
          "options": [
            "A. var",
            "B. let",
            "C. Both var and let",
            "D. Neither"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit for selecting var.",
          "common_misconceptions": [
            "let and var have identical scoping."
          ],
          "level_indicators": {
            "beginner": "Does not distinguish basic declaration behavior.",
            "developing": "Knows let is block-scoped but cannot explain why it matters.",
            "proficient": "Correctly distinguishes let, const and var in ordinary code.",
            "advanced": "Explains scope, hoisting and practical implications."
          }
        },
        {
          "id": "javascript_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Asynchronous reasoning",
          "prompt": "A button click starts a fetch request and then immediately reads the response body. What problem can occur, and how would you fix the flow?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Should identify that fetch is asynchronous and the response must be awaited or handled with a promise callback before using the body.",
          "acceptable_alternatives": [
            "Using then() correctly instead of async/await."
          ],
          "partial_credit_guidance": "Partial credit for recognizing asynchronous timing but not giving a complete solution.",
          "common_misconceptions": [
            "fetch() immediately returns the final JSON."
          ],
          "level_indicators": {
            "beginner": "Knows requests are asynchronous but cannot sequence operations.",
            "developing": "Can use async/await or promises with minor gaps.",
            "proficient": "Correctly sequences request, response and parsing.",
            "advanced": "Also addresses loading, errors, cancellation and race conditions."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands syntax and simple scripts.",
        "developing": "Can build ordinary scripts but has async or scope gaps.",
        "proficient": "Comfortable reasoning about core JavaScript execution.",
        "advanced": "Handles asynchronous, scope and edge-case behavior confidently."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "typescript",
    "name": "TypeScript",
    "category_id": "programming_language",
    "skill_type": "technical",
    "relevant_roles": [
      "Frontend",
      "Full-Stack",
      "Backend",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "TypeScript",
    "why_it_matters": "TypeScript is prominent in current frontend and software-engineer postings and is growing in developer usage.",
    "evidence_summary": "Current frontend postings mention TypeScript in 37.5%, while software-engineer postings mention it in 21.9%. JetBrains also identifies TypeScript as having the strongest real-world usage growth among languages in its 2025 survey.",
    "sources": [
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)"
    ],
    "assessment": {
      "purpose": "Test type reasoning, interfaces and practical narrowing.",
      "limitations": [
        "Does not assess advanced type-system design.",
        "Results should not be equated with production TypeScript experience."
      ],
      "questions": [
        {
          "id": "typescript_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Static typing",
          "prompt": "What is the main benefit of declaring function input types in TypeScript?",
          "options": [
            "A. It guarantees the program can never fail at runtime",
            "B. It enables compile-time checking of expected values",
            "C. It makes JavaScript execute faster in every case",
            "D. It removes the need for tests"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the student explains that TypeScript catches mismatches before runtime but incorrectly claims it prevents all runtime failures.",
          "common_misconceptions": [
            "TypeScript types automatically enforce runtime validation.",
            "Types replace tests."
          ],
          "level_indicators": {
            "beginner": "Sees TypeScript mainly as syntax decoration.",
            "developing": "Understands compile-time checking.",
            "proficient": "Can distinguish compile-time types from runtime validation.",
            "advanced": "Explains narrowing, structural typing and runtime boundaries."
          }
        },
        {
          "id": "typescript_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Type-safe API handling",
          "prompt": "An API may return either {success: true, data: string} or {success: false, error: string}. How would you model and safely handle this in TypeScript?",
          "options": [],
          "correct_answer_or_scoring_rubric": "A strong answer uses a discriminated union keyed by success and narrows before reading data or error.",
          "acceptable_alternatives": [
            "Equivalent union or type-guard designs."
          ],
          "partial_credit_guidance": "Half credit for identifying two possible shapes but not showing safe narrowing.",
          "common_misconceptions": [
            "Using one type with optional fields and blindly reading both."
          ],
          "level_indicators": {
            "beginner": "Can describe the two possible responses.",
            "developing": "Knows unions can model alternatives.",
            "proficient": "Uses a discriminant and safe narrowing.",
            "advanced": "Explains exhaustive handling and runtime validation at external boundaries."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic type annotations with limited reasoning.",
        "developing": "Understands common unions and interfaces.",
        "proficient": "Uses types to model realistic application behavior.",
        "advanced": "Handles complex narrowing and boundary validation."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "react",
    "name": "React",
    "category_id": "frontend",
    "skill_type": "technical",
    "relevant_roles": [
      "Frontend",
      "Full-Stack"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "React",
    "why_it_matters": "React is the strongest framework signal in current frontend postings.",
    "evidence_summary": "React is mentioned in 41% of current US Frontend Engineer postings analyzed by Apiva and 19.1% of broader Software Engineer postings.",
    "sources": [
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Test component/state fundamentals and reasoning about rendering.",
      "limitations": [
        "Does not assess advanced React performance or architecture.",
        "Does not prove production experience."
      ],
      "questions": [
        {
          "id": "react_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "State updates",
          "prompt": "Why should a React component use state when a changing value must trigger a re-render?",
          "options": [
            "A. State is automatically persisted to a database",
            "B. React tracks state changes and can re-render the component",
            "C. State makes every component global",
            "D. State prevents all bugs"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for saying state causes updates without explaining React's render behavior.",
          "common_misconceptions": [
            "Changing an ordinary local variable triggers re-rendering."
          ],
          "level_indicators": {
            "beginner": "Knows components display data but not state-driven rendering.",
            "developing": "Understands state triggers updates.",
            "proficient": "Correctly explains state, props and rendering.",
            "advanced": "Also reasons about derived state, effects and unnecessary renders."
          }
        },
        {
          "id": "react_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Component design",
          "prompt": "A user list, search box and user-detail panel have become one 500-line component. Give one sensible way to split it and explain the responsibility of each part.",
          "options": [],
          "correct_answer_or_scoring_rubric": "A good answer separates UI responsibilities such as SearchBox, UserList and UserDetail and keeps shared state at the nearest common parent when appropriate.",
          "acceptable_alternatives": [
            "Other reasonable decomposition based on data flow."
          ],
          "partial_credit_guidance": "Partial credit for identifying components without explaining data ownership.",
          "common_misconceptions": [
            "More components are always better.",
            "Each component must own all its state."
          ],
          "level_indicators": {
            "beginner": "Suggests splitting code but with unclear boundaries.",
            "developing": "Creates sensible component boundaries.",
            "proficient": "Explains state ownership and data flow.",
            "advanced": "Balances cohesion, reuse, render behavior and maintainability."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Can follow simple components.",
        "developing": "Understands props, state and ordinary component composition.",
        "proficient": "Can design maintainable React components.",
        "advanced": "Reasons about architecture, rendering behavior and trade-offs."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "web_fundamentals",
    "name": "Web Fundamentals",
    "category_id": "frontend",
    "skill_type": "technical",
    "relevant_roles": [
      "Frontend",
      "Full-Stack"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "refine_existing",
    "existing_skill_match": "HTML5 + CSS3",
    "why_it_matters": "HTML and CSS are still explicit fundamentals in current frontend job descriptions.",
    "evidence_summary": "Current frontend postings mention CSS in 21.1% and HTML in 16.9%. The existing HTML5/CSS3 labels should be simplified to HTML and CSS because the assessment should target transferable fundamentals rather than version naming.",
    "sources": [
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)"
    ],
    "assessment": {
      "purpose": "Test semantic HTML, layout and basic responsive CSS.",
      "limitations": [
        "Does not measure visual design ability.",
        "Does not assess advanced accessibility or browser rendering."
      ],
      "questions": [
        {
          "id": "web_fundamentals_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Semantic HTML",
          "prompt": "Which element is most appropriate for the main navigation links of a website?",
          "options": [
            "A. div",
            "B. nav",
            "C. span",
            "D. footer"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit for choosing a generic container.",
          "common_misconceptions": [
            "Semantic elements only affect visual appearance."
          ],
          "level_indicators": {
            "beginner": "Uses generic elements without semantic reasoning.",
            "developing": "Recognizes common semantic elements.",
            "proficient": "Chooses semantic structures appropriately.",
            "advanced": "Also considers accessibility, document structure and keyboard behavior."
          }
        },
        {
          "id": "web_fundamentals_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Responsive layout",
          "prompt": "A card grid looks good on desktop but overflows on mobile. Name two CSS/layout changes that could solve the problem.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Accept responsive grid/flex rules, flexible widths, media queries, minmax(), wrapping, or appropriate max-width changes.",
          "acceptable_alternatives": [
            "Any technically sound responsive-layout solution."
          ],
          "partial_credit_guidance": "Half credit for one valid fix.",
          "common_misconceptions": [
            "A fixed desktop width is sufficient for all screens."
          ],
          "level_indicators": {
            "beginner": "Suggests changing widths without responsive reasoning.",
            "developing": "Uses flexible dimensions or media queries.",
            "proficient": "Combines responsive layout rules appropriately.",
            "advanced": "Explains why the chosen layout remains robust across varying content and viewport sizes."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic HTML/CSS with limited layout understanding.",
        "developing": "Can build ordinary responsive pages.",
        "proficient": "Understands semantic structure and robust responsive layouts.",
        "advanced": "Handles accessibility and complex responsive behavior."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "sql",
    "name": "SQL",
    "category_id": "database",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "Software Engineering",
      "Data/Analytics",
      "AI/ML"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "SQL",
    "why_it_matters": "SQL is one of the broadest cross-role skills in the dataset.",
    "evidence_summary": "SQL appeared in 37,235 indexed postings in Skillenai's current 90-day data and 62.9% of the analyzed Data Analyst postings.",
    "sources": [
      "[https://skillenai.com/data/skill/sql](https://skillenai.com/data/skill/sql)",
      "[https://kitejobs.ai/reports/data-analyst](https://kitejobs.ai/reports/data-analyst)"
    ],
    "assessment": {
      "purpose": "Test querying, aggregation and filtering on realistic data.",
      "limitations": [
        "Does not assess database administration.",
        "Does not prove performance tuning ability."
      ],
      "questions": [
        {
          "id": "sql_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Filtering versus aggregation",
          "prompt": "Which clause filters rows before GROUP BY aggregation?",
          "options": [
            "A. WHERE",
            "B. HAVING",
            "C. ORDER BY",
            "D. LIMIT"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit unless the learner explicitly distinguishes WHERE from HAVING but selects incorrectly.",
          "common_misconceptions": [
            "WHERE and HAVING are interchangeable."
          ],
          "level_indicators": {
            "beginner": "Recognizes SELECT syntax but confuses filtering stages.",
            "developing": "Distinguishes WHERE and HAVING in simple cases.",
            "proficient": "Can reason about filtering, grouping and aggregation.",
            "advanced": "Explains query execution concepts and edge cases with joins."
          }
        },
        {
          "id": "sql_q2",
          "format": "practical_task",
          "difficulty": "intermediate",
          "competency_tested": "Aggregation",
          "prompt": "Given orders(customer_id, amount), write a query that returns each customer and their total order amount, sorted from highest total to lowest.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Expected structure: SELECT customer_id, SUM(amount) AS total_amount FROM orders GROUP BY customer_id ORDER BY total_amount DESC; equivalent valid SQL earns full credit.",
          "acceptable_alternatives": [
            "Equivalent SQL using a subquery or expression in ORDER BY."
          ],
          "partial_credit_guidance": "Partial credit for correct GROUP BY and SUM but missing or incorrect sorting.",
          "common_misconceptions": [
            "Grouping by amount instead of customer_id.",
            "Using WHERE to filter aggregates."
          ],
          "level_indicators": {
            "beginner": "Can write simple SELECT queries.",
            "developing": "Uses GROUP BY and aggregate functions with minor mistakes.",
            "proficient": "Correctly aggregates and sorts grouped results.",
            "advanced": "Also reasons about NULLs, joins and performance."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic SELECT/filtering only.",
        "developing": "Can perform common joins and aggregations.",
        "proficient": "Comfortably writes realistic analytical queries.",
        "advanced": "Handles complex query logic and performance considerations."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "git",
    "name": "Git",
    "category_id": "tools",
    "skill_type": "technical",
    "relevant_roles": [
      "Software Engineering",
      "Frontend",
      "Backend",
      "DevOps",
      "Data/Analytics"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Git",
    "why_it_matters": "Git is a broadly applicable delivery and collaboration skill.",
    "evidence_summary": "Git appeared in 14,181 indexed postings in current Skillenai data and 10% of current US software-engineer postings.",
    "sources": [
      "[https://skillenai.com/data/skill/git](https://skillenai.com/data/skill/git)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Test branching, commits, merging and safe collaboration.",
      "limitations": [
        "Does not measure real repository hygiene or code-review behavior."
      ],
      "questions": [
        {
          "id": "git_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Commit meaning",
          "prompt": "What is a Git commit best described as?",
          "options": [
            "A. A temporary local file",
            "B. A recorded snapshot of repository changes",
            "C. A cloud server",
            "D. A package manager"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Award partial credit only if the learner correctly describes versioned history but uses imprecise terminology.",
          "common_misconceptions": [
            "Every commit automatically changes the remote repository."
          ],
          "level_indicators": {
            "beginner": "Recognizes Git as version control.",
            "developing": "Understands commits and basic history.",
            "proficient": "Understands local versus remote workflows.",
            "advanced": "Reasons about rebasing, conflicts and recovery."
          }
        },
        {
          "id": "git_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Conflict handling",
          "prompt": "Two branches modify the same lines and a merge reports conflicts. What should you do before completing the merge?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Inspect both versions, resolve intentionally, run relevant tests, review the resulting diff and then commit the merge.",
          "acceptable_alternatives": [
            "Equivalent safe conflict-resolution workflow."
          ],
          "partial_credit_guidance": "Half credit for resolving conflicts without mentioning verification.",
          "common_misconceptions": [
            "Always choose 'ours' or 'theirs' automatically."
          ],
          "level_indicators": {
            "beginner": "Knows conflicts must be resolved.",
            "developing": "Can edit conflict markers and commit.",
            "proficient": "Resolves conflicts and verifies behavior before merging.",
            "advanced": "Considers history quality, risk and appropriate merge/rebase strategy."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Can clone, edit and commit with guidance.",
        "developing": "Can use normal branch workflows.",
        "proficient": "Can collaborate safely and resolve common conflicts.",
        "advanced": "Handles complex history and recovery scenarios."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "node_js",
    "name": "Node.js",
    "category_id": "backend",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "Full-Stack",
      "Software Engineering"
    ],
    "demand_level": "medium",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Node.js",
    "why_it_matters": "Node.js remains a common bridge from frontend JavaScript/TypeScript into backend development.",
    "evidence_summary": "Node.js appears in 9.7% of current US software-engineer postings and is a common pairing with TypeScript in the broader jobs index.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://skillenai.com/data/skill/typescript](https://skillenai.com/data/skill/typescript)"
    ],
    "assessment": {
      "purpose": "Test event-driven server concepts, modules and request handling.",
      "limitations": [
        "Does not assess framework-specific Node expertise."
      ],
      "questions": [
        {
          "id": "node_js_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Asynchronous I/O",
          "prompt": "Why is asynchronous I/O important in Node.js servers?",
          "options": [
            "A. It prevents any code from running sequentially",
            "B. It allows the process to handle other work while waiting on I/O",
            "C. It makes network requests unnecessary",
            "D. It turns JavaScript into a compiled language"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for understanding non-blocking work without explaining the waiting behavior.",
          "common_misconceptions": [
            "Asynchronous means everything runs in parallel."
          ],
          "level_indicators": {
            "beginner": "Knows Node handles web requests.",
            "developing": "Understands asynchronous I/O.",
            "proficient": "Reasons about event-loop behavior in common cases.",
            "advanced": "Identifies CPU-bound limitations and appropriate worker strategies."
          }
        },
        {
          "id": "node_js_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Backend request flow",
          "prompt": "An endpoint performs database access and then returns JSON. Describe the safe order of operations and what should happen if the database fails.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Validate input, perform database operation asynchronously, handle errors, avoid leaking internal details and return an appropriate response status/body.",
          "acceptable_alternatives": [
            "Equivalent sound request/error-handling flow."
          ],
          "partial_credit_guidance": "Half credit for the happy path without error handling.",
          "common_misconceptions": [
            "Returning a stack trace to the client is acceptable."
          ],
          "level_indicators": {
            "beginner": "Describes only the happy path.",
            "developing": "Includes asynchronous operation and basic error handling.",
            "proficient": "Includes validation, status codes and safe errors.",
            "advanced": "Also considers observability, retries, timeouts and idempotency."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic Node concepts.",
        "developing": "Can build simple endpoints.",
        "proficient": "Can reason about asynchronous backend request flows.",
        "advanced": "Handles production concerns around reliability and concurrency."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "rest_apis",
    "name": "REST APIs",
    "category_id": "backend",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "Full-Stack",
      "Frontend",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "API literacy connects frontend, backend and data services and is more transferable than memorizing a particular backend framework.",
    "evidence_summary": "REST APIs appeared in 6,467 current indexed postings and in 18.1% of analyzed US frontend postings and 10.7% of software-engineer postings.",
    "sources": [
      "[https://skillenai.com/data/skill/rest-apis](https://skillenai.com/data/skill/rest-apis)",
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Measure practical HTTP/API reasoning.",
      "limitations": [
        "Does not assess distributed-system design.",
        "A short assessment cannot prove API production experience."
      ],
      "questions": [
        {
          "id": "rest_apis_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "HTTP semantics",
          "prompt": "Which method is conventionally used to retrieve a resource without requesting a state change?",
          "options": [
            "A. GET",
            "B. POST",
            "C. PATCH",
            "D. DELETE"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "GET requests are never cached.",
            "POST is the default read method."
          ],
          "level_indicators": {
            "beginner": "Knows a few HTTP methods.",
            "developing": "Distinguishes basic CRUD-related methods.",
            "proficient": "Understands methods, status codes and resource semantics.",
            "advanced": "Reasons about idempotency, caching and API versioning."
          }
        },
        {
          "id": "rest_apis_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "API design",
          "prompt": "A client requests /users/42, but user 42 does not exist. What response should the API return and why?",
          "options": [],
          "correct_answer_or_scoring_rubric": "404 Not Found is the conventional response because the requested resource does not exist.",
          "acceptable_alternatives": [
            "Equivalent explanation using the API's documented resource semantics."
          ],
          "partial_credit_guidance": "Half credit for knowing it is a client-visible not-found condition but giving an incorrect status code.",
          "common_misconceptions": [
            "Every unsuccessful API request should return 500."
          ],
          "level_indicators": {
            "beginner": "Recognizes the request failed.",
            "developing": "Knows common status-code categories.",
            "proficient": "Maps common resource outcomes to appropriate HTTP semantics.",
            "advanced": "Also considers error schema, retries, observability and idempotency."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Can consume very simple APIs.",
        "developing": "Understands common HTTP/API patterns.",
        "proficient": "Can design and debug ordinary REST endpoints.",
        "advanced": "Handles API consistency, reliability and versioning trade-offs."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "testing",
    "name": "Software Testing",
    "category_id": "testing_qa",
    "skill_type": "technical",
    "relevant_roles": [
      "Software Engineering",
      "Frontend",
      "Backend",
      "DevOps"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Testing is repeatedly named in software and frontend postings and is especially important when AI can generate large volumes of code.",
    "evidence_summary": "Testing appears in 10.4% of current US software-engineer postings and 17.6% of current US frontend postings in the analyzed samples.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)"
    ],
    "assessment": {
      "purpose": "Test whether the learner can choose useful tests rather than merely describe testing.",
      "limitations": [
        "Does not assess a full QA strategy.",
        "A quiz does not verify sustained test maintenance."
      ],
      "questions": [
        {
          "id": "testing_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Test isolation",
          "prompt": "What is a primary goal of a unit test?",
          "options": [
            "A. Test the entire production environment",
            "B. Verify a small unit of behavior in isolation where practical",
            "C. Replace all integration tests",
            "D. Guarantee the program has no bugs"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the answer identifies focused behavior but incorrectly says isolation is always absolute.",
          "common_misconceptions": [
            "One passing test proves a feature is correct."
          ],
          "level_indicators": {
            "beginner": "Understands testing as finding bugs.",
            "developing": "Understands focused tests.",
            "proficient": "Chooses appropriate unit/integration coverage.",
            "advanced": "Balances test isolation, realism, maintainability and risk."
          }
        },
        {
          "id": "testing_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Test-case design",
          "prompt": "A function accepts an integer age from 0 to 120. Name useful test cases.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Should include valid boundaries 0 and 120, representative valid values, and invalid boundaries such as -1 and 121.",
          "acceptable_alternatives": [
            "Equivalent boundary and representative-value strategy."
          ],
          "partial_credit_guidance": "Half credit for several valid values without boundary testing.",
          "common_misconceptions": [
            "Only random normal values are necessary."
          ],
          "level_indicators": {
            "beginner": "Provides a couple of happy-path cases.",
            "developing": "Adds invalid inputs.",
            "proficient": "Uses boundary and representative cases.",
            "advanced": "Explains equivalence classes, risk and property-based approaches."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic test concepts.",
        "developing": "Can create ordinary unit and edge-case tests.",
        "proficient": "Chooses tests based on behavior and risk.",
        "advanced": "Designs layered, maintainable test strategies."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "docker",
    "name": "Docker",
    "category_id": "devops_cloud",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "DevOps",
      "Cloud",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Docker",
    "why_it_matters": "Containers are widespread across modern development workflows and are common in cloud-native stacks.",
    "evidence_summary": "Docker appears in 15.9% of current US software-engineer postings; Stack Overflow's 2025 technology survey also reported a large year-over-year increase in Docker usage.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://survey.stackoverflow.co/2025/technology](https://survey.stackoverflow.co/2025/technology)"
    ],
    "assessment": {
      "purpose": "Test container concepts and practical deployment reasoning.",
      "limitations": [
        "Does not assess complex container orchestration.",
        "Does not prove production Docker experience."
      ],
      "questions": [
        {
          "id": "docker_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Image versus container",
          "prompt": "What is the relationship between a Docker image and a running container?",
          "options": [
            "A. A container is a running instance created from an image",
            "B. An image is always running",
            "C. They are unrelated",
            "D. A container is the Dockerfile itself"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "A Dockerfile is the same thing as a running container."
          ],
          "level_indicators": {
            "beginner": "Recognizes Docker packages applications.",
            "developing": "Distinguishes images and containers.",
            "proficient": "Understands image creation, runtime and persistence.",
            "advanced": "Reasons about layers, networking, volumes and security."
          }
        },
        {
          "id": "docker_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Containerized application troubleshooting",
          "prompt": "A container starts and immediately exits, even though the application works locally. What would you investigate first?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Inspect container logs, entrypoint/command, environment variables, working directory, exposed dependencies and process lifetime.",
          "acceptable_alternatives": [
            "Equivalent systematic troubleshooting order."
          ],
          "partial_credit_guidance": "Half credit for checking logs but not describing further investigation.",
          "common_misconceptions": [
            "Exposing a port keeps a container alive."
          ],
          "level_indicators": {
            "beginner": "Knows to inspect logs.",
            "developing": "Checks command/configuration issues.",
            "proficient": "Systematically examines runtime dependencies and process lifecycle.",
            "advanced": "Also reasons about networking, secrets, health checks and reproducibility."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic image/container understanding.",
        "developing": "Can build and run common containers.",
        "proficient": "Can containerize and troubleshoot ordinary services.",
        "advanced": "Handles multi-container, networking and security concerns."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "aws",
    "name": "AWS",
    "category_id": "devops_cloud",
    "skill_type": "technical",
    "relevant_roles": [
      "Cloud",
      "DevOps",
      "Backend",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "AWS",
    "why_it_matters": "AWS is a strong recurring cloud-platform signal across software and infrastructure postings.",
    "evidence_summary": "AWS appears in 27.5% of current US software-engineer postings in Apiva and commonly pairs with Kubernetes, Docker, CI/CD and Terraform in current job indexes.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://skillenai.com/data/skill/aws](https://skillenai.com/data/skill/aws)"
    ],
    "assessment": {
      "purpose": "Measure cloud-service fundamentals rather than memorization of dozens of AWS product names.",
      "limitations": [
        "AWS assessments can become region- or service-specific.",
        "A short quiz does not validate production cloud operations."
      ],
      "questions": [
        {
          "id": "aws_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Cloud abstraction",
          "prompt": "Which statement best describes object storage such as Amazon S3?",
          "options": [
            "A. It stores objects such as files with associated metadata",
            "B. It is primarily a CPU scheduler",
            "C. It is a relational SQL query engine",
            "D. It replaces all databases"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "Object storage is interchangeable with a relational database."
          ],
          "level_indicators": {
            "beginner": "Recognizes major cloud-storage concepts.",
            "developing": "Distinguishes common cloud service categories.",
            "proficient": "Chooses services based on workload requirements.",
            "advanced": "Reasons about security, cost, durability and architecture."
          }
        },
        {
          "id": "aws_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Cloud architecture",
          "prompt": "A web application needs a public frontend, private backend services and persistent data. Describe one sensible high-level AWS arrangement.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Strong answer separates public entry points from private services and data, includes appropriate identity/security boundaries, and uses managed storage/database services where suitable.",
          "acceptable_alternatives": [
            "Any secure architecture that clearly separates public and private components."
          ],
          "partial_credit_guidance": "Half credit for identifying separate layers without explaining security boundaries.",
          "common_misconceptions": [
            "Every server should be directly exposed to the internet."
          ],
          "level_indicators": {
            "beginner": "Names relevant AWS services.",
            "developing": "Creates basic layered architecture.",
            "proficient": "Includes network and identity boundaries.",
            "advanced": "Also considers cost, scaling, observability, resilience and least privilege."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Knows basic cloud-service concepts.",
        "developing": "Can build simple cloud deployments with guidance.",
        "proficient": "Can choose common AWS services and design sensible boundaries.",
        "advanced": "Can reason about secure, scalable and cost-aware architectures."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "ci_cd",
    "name": "CI/CD",
    "category_id": "devops_cloud",
    "skill_type": "technical",
    "relevant_roles": [
      "DevOps",
      "Cloud",
      "Software Engineering",
      "Backend"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "CI/CD is a cross-cutting software-delivery competency rather than a tool-specific skill.",
    "evidence_summary": "CI/CD appears in 29,433 current indexed postings and 18.6% of analyzed US software-engineer postings.",
    "sources": [
      "[https://skillenai.com/data/skill/ci-cd](https://skillenai.com/data/skill/ci-cd)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Test delivery-pipeline reasoning and basic automation concepts.",
      "limitations": [
        "Does not assess a specific CI provider.",
        "Does not establish production deployment experience."
      ],
      "questions": [
        {
          "id": "ci_cd_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Pipeline purpose",
          "prompt": "What is the main purpose of CI in a software project?",
          "options": [
            "A. Automatically integrate and validate changes frequently",
            "B. Replace version control",
            "C. Eliminate the need for testing",
            "D. Guarantee zero downtime"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the learner understands automated validation but confuses CI with continuous deployment.",
          "common_misconceptions": [
            "CI and deployment are identical."
          ],
          "level_indicators": {
            "beginner": "Knows CI means automation.",
            "developing": "Understands automated build/test integration.",
            "proficient": "Can describe a useful CI/CD pipeline.",
            "advanced": "Considers rollback, approvals, artifacts, secrets and deployment strategies."
          }
        },
        {
          "id": "ci_cd_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Pipeline diagnosis",
          "prompt": "A deployment pipeline passes unit tests but production breaks immediately after release. Name two pipeline or process improvements that could reduce this risk.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Valid answers include integration/end-to-end tests, staging environments, health checks, canaries, deployment verification and rollback automation.",
          "acceptable_alternatives": [
            "Other technically valid pre- or post-deployment safeguards."
          ],
          "partial_credit_guidance": "Half credit for one valid safeguard.",
          "common_misconceptions": [
            "More unit tests alone always solve production failures."
          ],
          "level_indicators": {
            "beginner": "Suggests additional testing generally.",
            "developing": "Adds staging or integration checks.",
            "proficient": "Uses multiple risk controls around deployment.",
            "advanced": "Explains progressive delivery, rollback and production observability."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands basic automation.",
        "developing": "Can explain build/test/deploy flow.",
        "proficient": "Can design practical delivery pipelines.",
        "advanced": "Handles deployment risk and recovery mechanisms."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "kubernetes",
    "name": "Kubernetes",
    "category_id": "devops_cloud",
    "skill_type": "technical",
    "relevant_roles": [
      "DevOps",
      "Cloud",
      "Platform Engineering",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Kubernetes",
    "why_it_matters": "Kubernetes has become established infrastructure for production cloud-native and AI workloads.",
    "evidence_summary": "Kubernetes appears in 25,073 indexed postings and 22.9% of current US software-engineer postings; CNCF reports 82% of container users running Kubernetes in production.",
    "sources": [
      "[https://skillenai.com/data/skill/kubernetes](https://skillenai.com/data/skill/kubernetes)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://www.cncf.io/reports/the-cncf-annual-cloud-native-survey/](https://www.cncf.io/reports/the-cncf-annual-cloud-native-survey/)"
    ],
    "assessment": {
      "purpose": "Test orchestration concepts without assuming deep cluster administration.",
      "limitations": [
        "Kubernetes is frequently a mid-to-senior skill, so an assessed beginner result is normal.",
        "The quiz does not establish production operations expertise."
      ],
      "questions": [
        {
          "id": "kubernetes_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Pod concept",
          "prompt": "What is a Kubernetes Pod?",
          "options": [
            "A. A logical unit containing one or more closely related containers",
            "B. A cloud provider account",
            "C. A database table",
            "D. A Git branch"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "A Pod and a container are always identical concepts."
          ],
          "level_indicators": {
            "beginner": "Recognizes Kubernetes as container orchestration.",
            "developing": "Understands Pod and container relationships.",
            "proficient": "Understands workload/service concepts.",
            "advanced": "Reasons about scheduling, scaling, probes and resource constraints."
          }
        },
        {
          "id": "kubernetes_q2",
          "format": "scenario",
          "difficulty": "advanced",
          "competency_tested": "Operational reasoning",
          "prompt": "A service is running but users cannot reach it from outside the cluster. Name several things you would check.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Good answers examine Service configuration, selectors, endpoints, ingress/load balancer, network policies, ports and application health.",
          "acceptable_alternatives": [
            "Equivalent systematic Kubernetes networking investigation."
          ],
          "partial_credit_guidance": "Half credit for checking only one layer.",
          "common_misconceptions": [
            "A running Pod automatically receives a public internet address."
          ],
          "level_indicators": {
            "beginner": "Knows to inspect service exposure.",
            "developing": "Checks Service and port configuration.",
            "proficient": "Traces traffic across Service, ingress and workload.",
            "advanced": "Systematically diagnoses networking, policy, readiness and load-balancing issues."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands why Kubernetes exists but has limited operational knowledge.",
        "developing": "Can work with basic workloads and services.",
        "proficient": "Can reason about normal application deployment and troubleshooting.",
        "advanced": "Can diagnose multi-layer cluster behavior."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "terraform",
    "name": "Terraform",
    "category_id": "devops_cloud",
    "skill_type": "technical",
    "relevant_roles": [
      "DevOps",
      "Cloud",
      "Platform Engineering"
    ],
    "demand_level": "medium",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Infrastructure as code is a major part of cloud and DevOps workflows.",
    "evidence_summary": "Terraform appeared in 13,818 indexed postings; it was present in 53.2% of the indexed DevOps Engineer role sample and over 70% of several Cloud/DevOps subroles in the same dataset.",
    "sources": [
      "[https://skillenai.com/data/skill/terraform](https://skillenai.com/data/skill/terraform)"
    ],
    "assessment": {
      "purpose": "Test declarative infrastructure concepts rather than provider-specific syntax memorization.",
      "limitations": [
        "Terraform is highly role-specific for students.",
        "A quiz cannot establish infrastructure safety expertise."
      ],
      "questions": [
        {
          "id": "terraform_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Infrastructure as code",
          "prompt": "What is a key benefit of infrastructure as code?",
          "options": [
            "A. Infrastructure configuration becomes repeatable and version-controlled",
            "B. Servers no longer need monitoring",
            "C. Cloud providers become unnecessary",
            "D. Infrastructure changes never fail"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for recognizing repeatability but not version control.",
          "common_misconceptions": [
            "IaC means infrastructure is automatically safe."
          ],
          "level_indicators": {
            "beginner": "Recognizes Terraform as infrastructure tooling.",
            "developing": "Understands repeatable declarations.",
            "proficient": "Understands state, plans and versioned changes.",
            "advanced": "Reasons about modules, drift, locking, secrets and blast radius."
          }
        },
        {
          "id": "terraform_q2",
          "format": "scenario",
          "difficulty": "advanced",
          "competency_tested": "Change safety",
          "prompt": "A Terraform plan proposes destroying a production resource unexpectedly. What should happen before apply?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Do not blindly apply. Inspect the plan, compare configuration/state, identify the cause, protect critical resources where appropriate and obtain the required review.",
          "acceptable_alternatives": [
            "Equivalent safe infrastructure-change workflow."
          ],
          "partial_credit_guidance": "Half credit for saying 'review the plan' without identifying possible state/configuration causes.",
          "common_misconceptions": [
            "terraform apply should always be trusted if it generated a valid plan."
          ],
          "level_indicators": {
            "beginner": "Knows plans should be reviewed.",
            "developing": "Investigates unexpected changes.",
            "proficient": "Understands configuration/state drift and production safeguards.",
            "advanced": "Evaluates blast radius, state integrity and change-management controls."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands the purpose of IaC.",
        "developing": "Can follow simple Terraform configuration.",
        "proficient": "Can reason about plans, state and safe changes.",
        "advanced": "Understands production IaC risks and governance."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "java",
    "name": "Java",
    "category_id": "programming_language",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "Java",
    "why_it_matters": "Java remains a strong backend language, especially in enterprise software.",
    "evidence_summary": "Java appears in 21.9% of current US software-engineer postings and 37% of a broad 2026 Backend job-posting sample from Qarera.",
    "sources": [
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)",
      "[https://www.qarera.com/reports/most-in-demand-skills-2026](https://www.qarera.com/reports/most-in-demand-skills-2026)"
    ],
    "assessment": {
      "purpose": "Test object-oriented fundamentals and safe collection handling.",
      "limitations": [
        "Does not assess the Java ecosystem, JVM tuning or Spring expertise."
      ],
      "questions": [
        {
          "id": "java_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Object-oriented fundamentals",
          "prompt": "What does an interface primarily define in Java?",
          "options": [
            "A. A contract of behavior that implementing classes can provide",
            "B. A database schema",
            "C. A running thread",
            "D. A package manager"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for describing a contract without clearly distinguishing implementation.",
          "common_misconceptions": [
            "An interface is simply a class with no fields."
          ],
          "level_indicators": {
            "beginner": "Knows common Java syntax.",
            "developing": "Understands classes and interfaces.",
            "proficient": "Uses abstraction and inheritance appropriately.",
            "advanced": "Discusses composition, generics and API design trade-offs."
          }
        },
        {
          "id": "java_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Exception reasoning",
          "prompt": "A service occasionally throws NullPointerException when reading a customer address. Explain how you would find the cause and prevent a repeat.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Trace the failing input/path, inspect the stack trace, identify the null invariant violation, fix the source or validation and add a regression test.",
          "acceptable_alternatives": [
            "Equivalent debugging and regression-test workflow."
          ],
          "partial_credit_guidance": "Half credit for fixing the immediate null check without identifying why the value was null.",
          "common_misconceptions": [
            "Adding null checks everywhere is always the best fix."
          ],
          "level_indicators": {
            "beginner": "Can interpret a basic exception.",
            "developing": "Uses stack traces and validation.",
            "proficient": "Finds root cause and adds regression coverage.",
            "advanced": "Reasons about object contracts, API boundaries and defensive design."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic Java syntax and OOP.",
        "developing": "Can build ordinary Java programs.",
        "proficient": "Can debug and design common Java applications.",
        "advanced": "Handles larger object models and production concerns."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "postgresql",
    "name": "PostgreSQL",
    "category_id": "database",
    "skill_type": "technical",
    "relevant_roles": [
      "Backend",
      "Full-Stack",
      "Software Engineering",
      "Data/Analytics"
    ],
    "demand_level": "medium",
    "confidence": "high",
    "catalog_status": "keep_existing",
    "existing_skill_match": "PostgreSQL",
    "why_it_matters": "PostgreSQL is a strong practical database choice, especially for web and backend projects.",
    "evidence_summary": "PostgreSQL appeared in 8,802 indexed postings over the preceding 90 days and 12.7% of current US software-engineer postings.",
    "sources": [
      "[https://skillenai.com/data/skill/postgresql](https://skillenai.com/data/skill/postgresql)",
      "[https://apiva.ai/reports/software-engineer](https://apiva.ai/reports/software-engineer)"
    ],
    "assessment": {
      "purpose": "Test relational design and practical PostgreSQL usage.",
      "limitations": [
        "Does not assess advanced administration or query planning."
      ],
      "questions": [
        {
          "id": "postgresql_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Relational design",
          "prompt": "Why is a primary key useful in a relational table?",
          "options": [
            "A. It uniquely identifies rows",
            "B. It automatically encrypts the table",
            "C. It sorts every query permanently",
            "D. It replaces all indexes"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the learner mentions uniqueness but not row identity.",
          "common_misconceptions": [
            "A primary key is the same thing as an index in every practical sense."
          ],
          "level_indicators": {
            "beginner": "Knows tables and rows.",
            "developing": "Understands keys and relationships.",
            "proficient": "Models ordinary relational data correctly.",
            "advanced": "Reasons about indexing, constraints and normalization trade-offs."
          }
        },
        {
          "id": "postgresql_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Schema reasoning",
          "prompt": "An application stores repeated customer address fields in every order row. What database design issue could this create, and how might you improve it?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Should identify duplication/update anomalies and discuss normalization or a deliberate separate address/customer structure depending on requirements.",
          "acceptable_alternatives": [
            "A denormalized design with a clear reason and trade-off discussion."
          ],
          "partial_credit_guidance": "Half credit for recognizing duplication without describing the consequence.",
          "common_misconceptions": [
            "More tables are always better.",
            "Normalization should always be maximized regardless of workload."
          ],
          "level_indicators": {
            "beginner": "Notices duplicate data.",
            "developing": "Understands update anomalies.",
            "proficient": "Can normalize practical schemas.",
            "advanced": "Balances normalization, access patterns and performance."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic relational concepts.",
        "developing": "Can design ordinary relational schemas.",
        "proficient": "Can use PostgreSQL effectively for application data.",
        "advanced": "Handles schema, indexing and performance trade-offs."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "dsa",
    "name": "Data Structures & Algorithms",
    "category_id": "dsa",
    "skill_type": "technical",
    "relevant_roles": [
      "Software Engineering",
      "Backend",
      "Frontend",
      "AI/ML"
    ],
    "demand_level": "medium",
    "confidence": "medium",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "DSA remains relevant to technical screening, but it should not dominate Career Sync's broader practical assessment model.",
    "evidence_summary": "HackerRank reports strong developer preference for practical problem-solving assessment and 96% saying problem solving should matter more than memorization; recent Reddit internship and new-grad discussions also show LeetCode/OA preparation remains relevant. These are assessment signals rather than direct labor-demand measurements.",
    "sources": [
      "[https://www.hackerrank.com/reports/developer-skills-report-2025/](https://www.hackerrank.com/reports/developer-skills-report-2025/)",
      "[https://www.reddit.com/r/csMajors/comments/1s97qch/summer_2026_internships_over_6_offers_junior_cs/](https://www.reddit.com/r/csMajors/comments/1s97qch/summer_2026_internships_over_6_offers_junior_cs/)",
      "[https://www.reddit.com/r/csMajors/comments/1wbvl3a/no_internships_2026_new_grad_offers/](https://www.reddit.com/r/csMajors/comments/1wbvl3a/no_internships_2026_new_grad_offers/)"
    ],
    "assessment": {
      "purpose": "Measure transferable algorithmic reasoning without turning the profile into a LeetCode score.",
      "limitations": [
        "Interview-style DSA performance varies substantially from workplace programming.",
        "A few questions cannot establish broad algorithmic ability."
      ],
      "questions": [
        {
          "id": "dsa_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Complexity",
          "prompt": "What is the typical time complexity of looking up a value in a hash table by key, assuming a good hash distribution?",
          "options": [
            "A. O(1) average",
            "B. O(log n) average",
            "C. O(n) average",
            "D. O(n log n) average"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the learner notes that worst-case behavior differs but chooses the wrong average complexity.",
          "common_misconceptions": [
            "Hash lookup is guaranteed O(1) in every implementation."
          ],
          "level_indicators": {
            "beginner": "Recognizes basic complexity notation.",
            "developing": "Knows common data-structure complexities.",
            "proficient": "Chooses structures based on operation costs.",
            "advanced": "Distinguishes average/worst cases and workload trade-offs."
          }
        },
        {
          "id": "dsa_q2",
          "format": "practical_task",
          "difficulty": "intermediate",
          "competency_tested": "Problem decomposition",
          "prompt": "Given an array of integers, determine whether any value appears more than once. Describe an efficient approach and its complexity.",
          "options": [],
          "correct_answer_or_scoring_rubric": "A hash set provides an expected O(n) time and O(n) space solution by tracking previously seen values; sorting is a valid O(n log n) alternative.",
          "acceptable_alternatives": [
            "Sorting-based solution with correct complexity."
          ],
          "partial_credit_guidance": "Half credit for a correct O(n^2) nested-loop solution.",
          "common_misconceptions": [
            "Every duplicate problem requires sorting."
          ],
          "level_indicators": {
            "beginner": "Finds a correct brute-force approach.",
            "developing": "Finds an efficient set-based approach with minor complexity gaps.",
            "proficient": "Chooses an efficient structure and explains complexity.",
            "advanced": "Compares time, space and constraints to select the best approach."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Can solve straightforward problems with guidance.",
        "developing": "Can apply common data structures and algorithms.",
        "proficient": "Consistently selects efficient approaches for standard problems.",
        "advanced": "Reasons fluently about complexity and constraints."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "data_analysis",
    "name": "Data Analysis",
    "category_id": "data_analytics",
    "skill_type": "technical",
    "relevant_roles": [
      "Data/Analytics",
      "AI/ML",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Data analysis is a transferable competency that sits above any single BI product.",
    "evidence_summary": "Data analysis appears in 33.7% of current analyzed Data Analyst postings, with data visualization at 30.6% and data modeling at 19.9%.",
    "sources": [
      "[https://kitejobs.ai/reports/data-analyst](https://kitejobs.ai/reports/data-analyst)"
    ],
    "assessment": {
      "purpose": "Test interpretation, data quality and basic analytical reasoning.",
      "limitations": [
        "Does not measure domain expertise.",
        "Does not replace a portfolio or practical analysis task."
      ],
      "questions": [
        {
          "id": "data_analysis_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Mean versus median",
          "prompt": "A dataset contains salaries 40k, 45k, 48k and 500k. Which measure is more resistant to the extreme high value?",
          "options": [
            "A. Mean",
            "B. Median",
            "C. Both equally",
            "D. Range"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the learner recognizes the effect of the outlier but misnames the measure.",
          "common_misconceptions": [
            "The median is always the most informative statistic."
          ],
          "level_indicators": {
            "beginner": "Recognizes basic summary statistics.",
            "developing": "Chooses appropriate summaries for simple data.",
            "proficient": "Explains outliers and distribution effects.",
            "advanced": "Chooses methods based on distribution, sample and decision context."
          }
        },
        {
          "id": "data_analysis_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Data quality",
          "prompt": "A dashboard suddenly shows sales 40% higher than the previous week. Name several checks you would perform before concluding sales actually increased.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Check source completeness, duplicates, changed filters, date boundaries, data pipeline failures, schema changes and whether definitions changed.",
          "acceptable_alternatives": [
            "Other appropriate data-validation checks."
          ],
          "partial_credit_guidance": "Half credit for one or two checks.",
          "common_misconceptions": [
            "A large dashboard change must reflect real business change."
          ],
          "level_indicators": {
            "beginner": "Suggests rechecking the data.",
            "developing": "Looks for duplicates, filters or missing data.",
            "proficient": "Uses a structured data-quality investigation.",
            "advanced": "Separates data, metric-definition and business-process causes."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic descriptive analysis.",
        "developing": "Can perform common analyses and spot basic data issues.",
        "proficient": "Can turn imperfect data into defensible insights.",
        "advanced": "Reasons about methodology, uncertainty and decision impact."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "machine_learning",
    "name": "Machine Learning",
    "category_id": "ai_ml",
    "skill_type": "technical",
    "relevant_roles": [
      "AI/ML",
      "Data/Analytics",
      "Software Engineering"
    ],
    "demand_level": "high",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Machine learning is a strong specialized pathway and should be available without forcing AI/ML onto general software candidates.",
    "evidence_summary": "HackerRank's analysis of 976 AI-related job descriptions ranked Machine Learning first, followed by Python, PyTorch, TensorFlow and Deep Learning. Skillenai indexed 2,268 Machine Learning Engineer postings over the preceding 90 days.",
    "sources": [
      "[https://www.hackerrank.com/research/developer-skills/ai](https://www.hackerrank.com/research/developer-skills/ai)",
      "[https://skillenai.com/data/role/machine-learning-engineer](https://skillenai.com/data/role/machine-learning-engineer)"
    ],
    "assessment": {
      "purpose": "Test foundational ML reasoning, evaluation and overfitting.",
      "limitations": [
        "Does not measure advanced mathematics or research skill.",
        "A few questions cannot establish readiness for an ML engineering job."
      ],
      "questions": [
        {
          "id": "machine_learning_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Overfitting",
          "prompt": "What is a common sign of overfitting?",
          "options": [
            "A. Poor performance on both training and test data",
            "B. Very good training performance but substantially worse test performance",
            "C. Identical training and test performance",
            "D. Training data contains no labels"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit if the learner identifies poor generalization without clearly naming overfitting.",
          "common_misconceptions": [
            "Higher training accuracy always means a better model."
          ],
          "level_indicators": {
            "beginner": "Recognizes that models learn from data.",
            "developing": "Understands train/test generalization.",
            "proficient": "Explains overfitting and regularization at a basic level.",
            "advanced": "Connects overfitting to model capacity, leakage and validation strategy."
          }
        },
        {
          "id": "machine_learning_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Model evaluation",
          "prompt": "A fraud model catches 95% of fraud but flags 30% of legitimate transactions. What would you investigate before declaring it successful?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Discuss precision/recall, false-positive cost, class imbalance, threshold selection, validation design and business consequences.",
          "acceptable_alternatives": [
            "Equivalent evaluation based on costs and relevant metrics."
          ],
          "partial_credit_guidance": "Half credit for mentioning accuracy or recall alone.",
          "common_misconceptions": [
            "Accuracy alone determines whether a classifier is useful."
          ],
          "level_indicators": {
            "beginner": "Knows that the model makes errors.",
            "developing": "Recognizes false positives and false negatives.",
            "proficient": "Uses appropriate classification metrics and cost reasoning.",
            "advanced": "Connects thresholding, calibration, drift and deployment consequences."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands basic supervised-learning concepts.",
        "developing": "Can reason about training, validation and common metrics.",
        "proficient": "Can evaluate ordinary ML models and failure modes.",
        "advanced": "Connects model behavior to data, metrics and deployment."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "ai_assisted_development",
    "name": "AI-Assisted Development",
    "category_id": "ai_ml",
    "skill_type": "technical",
    "relevant_roles": [
      "Software Engineering",
      "Frontend",
      "Backend",
      "AI/ML",
      "Data/Analytics"
    ],
    "demand_level": "emerging",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "The relevant skill is not merely prompting; it is using AI productively while verifying, debugging and taking responsibility for the result.",
    "evidence_summary": "LinkedIn identifies AI and LLM-related skills as growing areas; JetBrains reports widespread AI coding use and strong expectations for future AI proficiency; HackerRank describes extensive AI use and an assessment gap around practical skills.",
    "sources": [
      "[https://news.linkedin.com/2026/Skills-on-the-rise-2026](https://news.linkedin.com/2026/Skills-on-the-rise-2026)",
      "[https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)",
      "[https://www.hackerrank.com/reports/developer-skills-report-2025/](https://www.hackerrank.com/reports/developer-skills-report-2025/)"
    ],
    "assessment": {
      "purpose": "Measure responsible AI-assisted engineering: decomposition, verification, debugging and judgment.",
      "limitations": [
        "Tool-specific prompt quality changes rapidly.",
        "The assessment should not reward verbosity or dependence on a specific AI model."
      ],
      "questions": [
        {
          "id": "ai_assisted_development_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "AI output verification",
          "prompt": "An AI assistant generates code that passes one test but you do not understand part of it. What is the best next step?",
          "options": [
            "A. Merge it because the test passed",
            "B. Delete it automatically",
            "C. Review and understand the behavior, run relevant tests and inspect edge cases",
            "D. Ask the AI to guarantee it is correct"
          ],
          "correct_answer_or_scoring_rubric": "C",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for testing without discussing understanding or review.",
          "common_misconceptions": [
            "Passing tests proves correctness.",
            "AI-generated code is automatically trustworthy."
          ],
          "level_indicators": {
            "beginner": "Uses AI mainly for generation.",
            "developing": "Recognizes the need for verification.",
            "proficient": "Combines AI use with testing and code review.",
            "advanced": "Identifies hidden assumptions, security risk and context limitations."
          }
        },
        {
          "id": "ai_assisted_development_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "AI-assisted debugging",
          "prompt": "An AI-generated fix resolves a bug but changes unrelated code across six files. How would you decide whether to accept it?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Inspect the diff, determine why each change is necessary, run targeted tests, reduce unrelated changes where possible, and review regression/security risk.",
          "acceptable_alternatives": [
            "Equivalent evidence-based review process."
          ],
          "partial_credit_guidance": "Half credit for inspecting the diff without considering tests or scope.",
          "common_misconceptions": [
            "A larger refactor is automatically better.",
            "AI can explain its own correctness reliably."
          ],
          "level_indicators": {
            "beginner": "Accepts or rejects based mainly on trust.",
            "developing": "Reviews the generated diff and tests.",
            "proficient": "Evaluates necessity, scope, regressions and maintainability.",
            "advanced": "Also assesses architecture, security and whether the prompt/tool workflow should change."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Can use AI tools with limited verification.",
        "developing": "Uses AI while performing basic checks.",
        "proficient": "Uses AI as an accelerator without outsourcing engineering judgment.",
        "advanced": "Builds reliable AI-assisted workflows with strong verification and risk control."
      },
      "ai_evaluation": {
        "recommended": true,
        "what_to_evaluate": "Whether the response demonstrates decomposition, verification, debugging, awareness of uncertainty and appropriate human judgment.",
        "evidence_to_use": "The user's explanation of how they would inspect, test, modify and validate AI-generated work. Do not reward prompt length or style.",
        "uncertainty_and_user_review": "AI should provide a rationale and confidence level. The user should be able to review or override the suggested level."
      }
    }
  },
  {
    "id": "cloud_security",
    "name": "Cloud Security",
    "category_id": "cybersecurity",
    "skill_type": "technical",
    "relevant_roles": [
      "Cybersecurity",
      "Cloud",
      "DevOps"
    ],
    "demand_level": "emerging",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Cloud security is a useful cross-disciplinary specialization as organizations increasingly depend on cloud infrastructure.",
    "evidence_summary": "ISC2 reports cloud computing security as a leading global cybersecurity skills need, while Skillenai indexed 1,634 Cloud Security postings over the preceding 90 days.",
    "sources": [
      "[https://www.isc2.org/Insights/2026/04/cloud-security-research-deep-dive](https://www.isc2.org/Insights/2026/04/cloud-security-research-deep-dive)",
      "[https://skillenai.com/data/skill/cloud-security](https://skillenai.com/data/skill/cloud-security)"
    ],
    "assessment": {
      "purpose": "Test least privilege, exposure and basic cloud-security reasoning.",
      "limitations": [
        "Does not establish security certification-level competence.",
        "Security scenarios should avoid operational exploitation instructions."
      ],
      "questions": [
        {
          "id": "cloud_security_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Least privilege",
          "prompt": "What does the principle of least privilege mean?",
          "options": [
            "A. Give every user administrator access",
            "B. Give identities only the permissions they need",
            "C. Disable all logging",
            "D. Store credentials in source code"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "Security is achieved mainly through strong passwords."
          ],
          "level_indicators": {
            "beginner": "Knows basic security principles.",
            "developing": "Applies least privilege to ordinary examples.",
            "proficient": "Recognizes identity, exposure and privilege risks.",
            "advanced": "Reasons about service identities, secret rotation and layered controls."
          }
        },
        {
          "id": "cloud_security_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Security review",
          "prompt": "A cloud storage bucket containing application data has accidentally become publicly readable. What should the team do first and what should it investigate afterward?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Restrict public access promptly, preserve relevant evidence/logs, determine exposure scope, rotate affected secrets if necessary, identify the configuration change and prevent recurrence.",
          "acceptable_alternatives": [
            "Equivalent incident-response sequence emphasizing containment and investigation."
          ],
          "partial_credit_guidance": "Half credit for fixing access but not investigating exposure.",
          "common_misconceptions": [
            "Changing the password alone resolves a public storage exposure."
          ],
          "level_indicators": {
            "beginner": "Recognizes that public exposure is dangerous.",
            "developing": "Contains the exposure and investigates basics.",
            "proficient": "Combines containment, evidence gathering and remediation.",
            "advanced": "Also addresses root cause, detection, policy and preventative controls."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Understands basic cloud-security principles.",
        "developing": "Can recognize common exposure and identity risks.",
        "proficient": "Can reason about ordinary cloud-security incidents.",
        "advanced": "Thinks in terms of layered controls, incident response and prevention."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "kotlin",
    "name": "Kotlin",
    "category_id": "mobile",
    "skill_type": "technical",
    "relevant_roles": [
      "Mobile",
      "Android",
      "Software Engineering"
    ],
    "demand_level": "medium",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Kotlin is a strong Android/mobile specialization and is also appearing in broader software-engineer hiring data.",
    "evidence_summary": "Kotlin appears in 4,169 indexed postings, with extremely high prevalence in Android Software Engineer and Mobile Application Developer role samples; current frontend postings also mention Kotlin at 22%.",
    "sources": [
      "[https://skillenai.com/data/skill/kotlin](https://skillenai.com/data/skill/kotlin)",
      "[https://apiva.ai/reports/frontend-engineer](https://apiva.ai/reports/frontend-engineer)"
    ],
    "assessment": {
      "purpose": "Provide a lightweight Android-oriented language assessment.",
      "limitations": [
        "Does not assess Android SDK or Jetpack expertise."
      ],
      "questions": [
        {
          "id": "kotlin_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Null safety",
          "prompt": "What is the main purpose of Kotlin's nullable type system?",
          "options": [
            "A. To make all values immutable",
            "B. To represent and handle possible null values explicitly",
            "C. To remove the need for testing",
            "D. To make code execute only on Android"
          ],
          "correct_answer_or_scoring_rubric": "B",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "Partial credit for recognizing null handling but not explaining explicit nullable types.",
          "common_misconceptions": [
            "Kotlin eliminates every possible null-related bug."
          ],
          "level_indicators": {
            "beginner": "Knows basic Kotlin syntax.",
            "developing": "Understands nullable and non-nullable types.",
            "proficient": "Uses safe calls and explicit null handling correctly.",
            "advanced": "Reasons about type contracts and boundary validation."
          }
        },
        {
          "id": "kotlin_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Mobile state reasoning",
          "prompt": "An Android screen loses its data after rotation. What kind of state-management issue could cause this and what should be investigated?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Investigate lifecycle recreation and whether screen state is stored in an appropriate lifecycle-aware state holder such as a ViewModel.",
          "acceptable_alternatives": [
            "Equivalent Android lifecycle/state-management explanation."
          ],
          "partial_credit_guidance": "Half credit for recognizing recreation but not proposing lifecycle-aware state handling.",
          "common_misconceptions": [
            "Rotation simply redraws the same object without lifecycle changes."
          ],
          "level_indicators": {
            "beginner": "Recognizes that screen state can reset.",
            "developing": "Knows about lifecycle and recreation.",
            "proficient": "Uses lifecycle-aware state patterns.",
            "advanced": "Reasons about process death, saved state and architecture boundaries."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic Kotlin language understanding.",
        "developing": "Can write ordinary Kotlin and reason about nullability.",
        "proficient": "Can build and troubleshoot common Kotlin application logic.",
        "advanced": "Understands lifecycle-aware architecture and deeper Kotlin behavior."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "swift",
    "name": "Swift",
    "category_id": "mobile",
    "skill_type": "technical",
    "relevant_roles": [
      "Mobile",
      "iOS",
      "Software Engineering"
    ],
    "demand_level": "medium",
    "confidence": "high",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Swift is a direct iOS development pathway and should be discoverable for mobile-focused users.",
    "evidence_summary": "Swift appears in 2,169 indexed postings, with very high prevalence in iOS Software Engineer and iOS Developer role samples.",
    "sources": [
      "[https://skillenai.com/data/skill/swift](https://skillenai.com/data/skill/swift)"
    ],
    "assessment": {
      "purpose": "Provide a lightweight iOS-oriented language assessment.",
      "limitations": [
        "Does not assess SwiftUI or iOS SDK expertise."
      ],
      "questions": [
        {
          "id": "swift_q1",
          "format": "multiple_choice",
          "difficulty": "introductory",
          "competency_tested": "Optionals",
          "prompt": "What does a Swift Optional represent?",
          "options": [
            "A. A value that may be present or nil",
            "B. A value that must always be immutable",
            "C. A background thread",
            "D. A database record"
          ],
          "correct_answer_or_scoring_rubric": "A",
          "acceptable_alternatives": [],
          "partial_credit_guidance": "No partial credit.",
          "common_misconceptions": [
            "Optional means the value is randomly selected."
          ],
          "level_indicators": {
            "beginner": "Knows basic Swift syntax.",
            "developing": "Understands optionals and unwrapping.",
            "proficient": "Uses safe optional handling appropriately.",
            "advanced": "Reasons about API boundaries and ownership/lifetime interactions."
          }
        },
        {
          "id": "swift_q2",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Asynchronous application behavior",
          "prompt": "An iOS screen loads data from a network request. How would you avoid blocking the UI and how would you handle failure?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Use appropriate asynchronous APIs, update UI on the correct execution context, show loading/error states and avoid unsafe assumptions about response timing.",
          "acceptable_alternatives": [
            "Equivalent modern Swift concurrency approach."
          ],
          "partial_credit_guidance": "Half credit for asynchronous execution without error/UI-state handling.",
          "common_misconceptions": [
            "Network requests should run synchronously on the main thread."
          ],
          "level_indicators": {
            "beginner": "Knows network requests take time.",
            "developing": "Uses asynchronous APIs.",
            "proficient": "Handles loading, success and failure safely.",
            "advanced": "Considers cancellation, concurrency and lifecycle behavior."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Basic Swift syntax.",
        "developing": "Can handle common Swift language constructs.",
        "proficient": "Can reason about ordinary iOS application logic.",
        "advanced": "Handles concurrency, lifecycle and robust error behavior."
      },
      "ai_evaluation": {
        "recommended": false,
        "what_to_evaluate": "",
        "evidence_to_use": "",
        "uncertainty_and_user_review": ""
      }
    }
  },
  {
    "id": "problem_solving",
    "name": "Problem Solving",
    "category_id": "professional",
    "skill_type": "professional",
    "relevant_roles": [
      "All target roles"
    ],
    "demand_level": "high",
    "confidence": "medium",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Problem solving is broadly valued in technical work and is especially important as AI automates more routine code production.",
    "evidence_summary": "HackerRank reports 96% of surveyed developers believe problem solving should matter more than memorization. This supports assessing reasoning, but it is not equivalent to a direct job-posting frequency measure.",
    "sources": [
      "[https://www.hackerrank.com/reports/developer-skills-report-2025/](https://www.hackerrank.com/reports/developer-skills-report-2025/)",
      "[https://www.reddit.com/r/cscareerquestions/comments/1wo90w90/a_junior_i_hate_what_ai_has_done_to_my_development_as_an_engineer/](https://www.reddit.com/r/cscareerquestions/comments/1wo90w90/a_junior_i_hate_what_ai_has_done_to_my_development_as_an_engineer/)"
    ],
    "assessment": {
      "purpose": "Assess structured reasoning, ambiguity handling and decomposition.",
      "limitations": [
        "Do not present the result as an intelligence score.",
        "One scenario cannot reliably measure general problem-solving ability."
      ],
      "questions": [
        {
          "id": "problem_solving_q1",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Problem decomposition",
          "prompt": "A user reports that 'the app is slow.' What would you ask or measure before changing code?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Strong answer narrows the problem using timing, affected users/paths, reproducibility, recent changes, client/server/database stages and concrete measurements.",
          "acceptable_alternatives": [
            "Equivalent evidence-driven diagnosis."
          ],
          "partial_credit_guidance": "Half credit for suggesting profiling without first defining what is slow.",
          "common_misconceptions": [
            "Start optimizing immediately based on intuition."
          ],
          "level_indicators": {
            "beginner": "Starts proposing fixes immediately.",
            "developing": "Asks clarifying questions and basic measurements.",
            "proficient": "Builds a structured diagnosis before intervention.",
            "advanced": "Prioritizes hypotheses, measurements and trade-offs systematically."
          }
        },
        {
          "id": "problem_solving_q2",
          "format": "scenario",
          "difficulty": "advanced",
          "competency_tested": "Trade-off reasoning",
          "prompt": "You can solve a bug with a one-line workaround or a larger underlying redesign. What factors should guide the choice?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Consider severity, frequency, root cause, time, risk, maintainability, affected scope, likelihood of recurrence and whether a temporary mitigation is appropriate.",
          "acceptable_alternatives": [
            "Equivalent trade-off framework."
          ],
          "partial_credit_guidance": "Half credit for mentioning code quality alone without operational context.",
          "common_misconceptions": [
            "The most architecturally elegant fix is always best."
          ],
          "level_indicators": {
            "beginner": "Recognizes there are multiple possible fixes.",
            "developing": "Considers effort and maintainability.",
            "proficient": "Balances technical and product risk.",
            "advanced": "Makes explicit trade-offs based on evidence and reversibility."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Needs guidance to structure ambiguous problems.",
        "developing": "Can reason through well-defined problems.",
        "proficient": "Approaches ambiguous problems systematically.",
        "advanced": "Makes evidence-based trade-offs under uncertainty."
      },
      "ai_evaluation": {
        "recommended": true,
        "what_to_evaluate": "Clarifying questions, decomposition, evidence gathering, prioritization and explicit trade-offs.",
        "evidence_to_use": "The user's reasoning text and selected actions, not writing style or confidence.",
        "uncertainty_and_user_review": "Because open-ended reasoning is subjective, provide a rationale and confidence range and allow user review."
      }
    }
  },
  {
    "id": "professional_communication",
    "name": "Professional Communication",
    "category_id": "professional",
    "skill_type": "professional",
    "relevant_roles": [
      "All target roles"
    ],
    "demand_level": "high",
    "confidence": "medium",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Technical workers need to communicate decisions, blockers, requirements and uncertainty clearly.",
    "evidence_summary": "LinkedIn's 2026 research identifies stakeholder communication and communication through uncertainty as growing skills; JetBrains also reports communication and clarity as critical developer-performance factors.",
    "sources": [
      "[https://news.linkedin.com/2026/Skills-on-the-rise-2026](https://news.linkedin.com/2026/Skills-on-the-rise-2026)",
      "[https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)"
    ],
    "assessment": {
      "purpose": "Assess clarity, relevance, structure and audience awareness in realistic workplace communication.",
      "limitations": [
        "Does not measure personality or overall communication ability.",
        "Written communication cannot fully predict live communication."
      ],
      "questions": [
        {
          "id": "professional_communication_q1",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Status communication",
          "prompt": "A feature will miss its planned deadline because an API dependency changed. Write a short update to a teammate or manager.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Score for clear status, concrete cause, impact, current action and revised expectation. Avoid blame and unnecessary detail.",
          "acceptable_alternatives": [
            "Any concise professional update containing the same evidence."
          ],
          "partial_credit_guidance": "Give partial credit when the cause and status are clear but impact or next step is missing.",
          "common_misconceptions": [
            "Professional communication means being excessively formal.",
            "A good update hides uncertainty."
          ],
          "level_indicators": {
            "beginner": "Message is understandable but vague or incomplete.",
            "developing": "Includes cause and current status.",
            "proficient": "Communicates status, impact and next action clearly.",
            "advanced": "Adapts detail to audience and communicates uncertainty precisely."
          }
        },
        {
          "id": "professional_communication_q2",
          "format": "scenario",
          "difficulty": "advanced",
          "competency_tested": "Technical explanation",
          "prompt": "Explain to a non-technical stakeholder why a seemingly small security fix needs engineering time.",
          "options": [],
          "correct_answer_or_scoring_rubric": "Should explain the user/business risk, what needs changing, likely impact and why safe implementation/testing takes time, without unnecessary jargon.",
          "acceptable_alternatives": [
            "Equivalent audience-appropriate explanation."
          ],
          "partial_credit_guidance": "Half credit for explaining the technical issue accurately but not translating it to stakeholder impact.",
          "common_misconceptions": [
            "Technical detail automatically makes an explanation more convincing."
          ],
          "level_indicators": {
            "beginner": "Accurate but jargon-heavy explanation.",
            "developing": "Explains the issue in understandable terms.",
            "proficient": "Connects technical work to stakeholder impact.",
            "advanced": "Communicates risk, uncertainty and trade-offs clearly for the audience."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Communication is understandable but inconsistent in structure or audience awareness.",
        "developing": "Communicates ordinary work situations clearly.",
        "proficient": "Adapts concise explanations to audience and context.",
        "advanced": "Handles uncertainty, risk and technical-to-business translation especially well."
      },
      "ai_evaluation": {
        "recommended": true,
        "what_to_evaluate": "Clarity, completeness, audience awareness, factual precision and whether the message distinguishes facts from uncertainty.",
        "evidence_to_use": "The actual written response and the scenario constraints.",
        "uncertainty_and_user_review": "AI scores should include examples of strengths and weaknesses, not a personality judgment. The user can review or override the level."
      }
    }
  },
  {
    "id": "collaboration",
    "name": "Collaboration",
    "category_id": "professional",
    "skill_type": "professional",
    "relevant_roles": [
      "All target roles"
    ],
    "demand_level": "high",
    "confidence": "medium",
    "catalog_status": "add_new",
    "existing_skill_match": null,
    "why_it_matters": "Software work is performed in shared codebases and cross-functional teams, making collaboration a practical skill rather than a personality trait.",
    "evidence_summary": "LinkedIn identifies cross-functional collaboration as an increasingly important skill, while JetBrains reports internal collaboration as a critical contributor to developer performance.",
    "sources": [
      "[https://news.linkedin.com/2026/Skills-on-the-rise-2026](https://news.linkedin.com/2026/Skills-on-the-rise-2026)",
      "[https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/](https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/)"
    ],
    "assessment": {
      "purpose": "Assess behavior in practical team situations such as code review, disagreement and shared ownership.",
      "limitations": [
        "Scenario answers cannot prove real-world teamwork.",
        "Do not label users as 'good' or 'bad teammates'."
      ],
      "questions": [
        {
          "id": "collaboration_q1",
          "format": "scenario",
          "difficulty": "intermediate",
          "competency_tested": "Code review collaboration",
          "prompt": "A teammate leaves a review comment that you believe is unnecessary. How would you respond?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Strong response seeks context, explains trade-offs respectfully, distinguishes preference from correctness and agrees on a practical resolution.",
          "acceptable_alternatives": [
            "Equivalent respectful evidence-based disagreement."
          ],
          "partial_credit_guidance": "Half credit for respectfully disagreeing without seeking context.",
          "common_misconceptions": [
            "The person with more experience is automatically correct.",
            "Disagreement should be avoided."
          ],
          "level_indicators": {
            "beginner": "Either avoids discussion or responds defensively.",
            "developing": "Can disagree respectfully.",
            "proficient": "Uses evidence and shared goals to resolve disagreement.",
            "advanced": "Separates preferences from standards and seeks durable team alignment."
          }
        },
        {
          "id": "collaboration_q2",
          "format": "scenario",
          "difficulty": "advanced",
          "competency_tested": "Cross-functional collaboration",
          "prompt": "A product requirement is ambiguous and engineering, design and product interpret it differently. What would you do before implementation?",
          "options": [],
          "correct_answer_or_scoring_rubric": "Surface the ambiguity, gather stakeholders, define the intended outcome and acceptance criteria, document the decision and identify unresolved assumptions.",
          "acceptable_alternatives": [
            "Equivalent alignment and documentation process."
          ],
          "partial_credit_guidance": "Half credit for holding a meeting but not producing a concrete shared outcome.",
          "common_misconceptions": [
            "Engineering should decide unilaterally because it owns implementation."
          ],
          "level_indicators": {
            "beginner": "Recognizes the requirement is unclear.",
            "developing": "Seeks clarification from stakeholders.",
            "proficient": "Creates shared acceptance criteria and documents decisions.",
            "advanced": "Surfaces assumptions, trade-offs and unresolved risk before implementation."
          }
        }
      ],
      "suggested_result_label_guidance": {
        "beginner": "Needs support handling disagreement or ambiguity.",
        "developing": "Can collaborate effectively in ordinary team situations.",
        "proficient": "Uses evidence, shared goals and clear ownership.",
        "advanced": "Facilitates alignment across technical and non-technical stakeholders."
      },
      "ai_evaluation": {
        "recommended": true,
        "what_to_evaluate": "Respect for others, evidence-based disagreement, clarification, shared goals and explicit decisions.",
        "evidence_to_use": "Scenario responses only. Do not infer personality or honesty.",
        "uncertainty_and_user_review": "Provide transparent rubric-based feedback and state that the result is a situational signal, not a personality assessment."
      }
    }
  }
];

export const ONBOARDING_DEFAULTS = {
  "core_skills": [
    "git",
    "sql",
    "rest_apis",
    "testing",
    "problem_solving",
    "professional_communication",
    "collaboration",
    "ai_assisted_development"
  ],
  "role_specific_skills": [
    "frontend: react, typescript, javascript, web_fundamentals, testing",
    "backend: python, java, node_js, rest_apis, sql, postgresql",
    "full_stack: javascript, typescript, react, node_js, rest_apis, sql",
    "data_analytics: sql, python, data_analysis",
    "cloud_devops: aws, docker, ci_cd, kubernetes, terraform",
    "cybersecurity: cloud_security",
    "mobile: kotlin, swift",
    "ai_ml: python, machine_learning, ai_assisted_development"
  ],
  "professional_skills": [
    "problem_solving",
    "professional_communication",
    "collaboration"
  ],
  "emerging_skills": [
    "ai_assisted_development",
    "cloud_security"
  ],
  "allow_custom_skills": true,
  "let_users_review_or_correct_assessed_levels": true,
  "show_sources_and_last_updated_date": true,
  "warning_copy": "Assessment results are evidence-based suggestions from a small set of questions, not guarantees of job readiness. They should be reviewed against projects, coursework, interviews and real-world experience."
};


export const TRENDING_SKILLS = [
  'React', 'Python', 'TypeScript', 'SQL', 'Git', 'REST APIs',
  'Docker', 'AWS', 'AI-Assisted Development', 'Problem Solving',
  'Professional Communication', 'Collaboration'
];

export const PROFICIENCY_LEVELS = [
  { label: 'Beginner', value: 40, description: 'Foundational understanding with guided execution' },
  { label: 'Developing', value: 65, description: 'Able to build and troubleshoot standard tasks' },
  { label: 'Proficient', value: 85, description: 'Strong conceptual grasp, works autonomously and handles edge cases' },
  { label: 'Advanced', value: 95, description: 'Deep mastery, architecture, optimization and systems-level reasoning' }
];

export function findSkill(skillIdOrName) {
  if (!skillIdOrName) return null;
  const q = skillIdOrName.toLowerCase().trim();
  return RECOMMENDED_SKILLS.find(s => 
    s.id.toLowerCase() === q || 
    s.name.toLowerCase() === q ||
    s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q.replace(/[^a-z0-9]/g, '')
  ) || null;
}

export function evaluateSkillAssessment(skill, userAnswers) {
  if (!skill || !skill.assessment || !skill.assessment.questions) {
    return { level: 'Proficient', score: 85, summary: 'Skill added with standard proficiency' };
  }

  const questions = skill.assessment.questions;
  let totalPoints = 0;
  let maxPoints = questions.length * 10;

  questions.forEach((q, idx) => {
    const answer = (userAnswers[q.id] || userAnswers[idx] || '').trim();
    if (!answer) return;

    if (q.format === 'multiple_choice') {
      const correct = (q.correct_answer_or_scoring_rubric || '').trim().toUpperCase();
      const userChoice = answer.trim().toUpperCase();
      // check if user selected the letter or full answer containing the letter
      if (userChoice === correct || userChoice.startsWith(correct + '.') || userChoice.startsWith(correct + ' ') || userChoice.startsWith(correct + ')')) {
        totalPoints += 10;
      } else {
        totalPoints += 2;
      }
    } else {
      // Scenario or practical task evaluation
      const rubric = (q.correct_answer_or_scoring_rubric || '').toLowerCase();
      const ansLower = answer.toLowerCase();
      
      const rubricWords = rubric.split(/[^a-z0-9]+/).filter(w => w.length > 3);
      let matchCount = 0;
      rubricWords.forEach(w => {
        if (ansLower.includes(w)) matchCount++;
      });

      const matchRatio = rubricWords.length > 0 ? matchCount / rubricWords.length : 0.5;
      
      if (answer.length > 80 && matchRatio > 0.25) {
        totalPoints += 10;
      } else if (answer.length > 40 || matchRatio > 0.15) {
        totalPoints += 7;
      } else if (answer.length > 10) {
        totalPoints += 4;
      } else {
        totalPoints += 2;
      }
    }
  });

  const pct = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 75;
  let level = 'Developing';
  let score = 65;
  let summary = skill.assessment.suggested_result_label_guidance?.developing || 'Can apply this skill in ordinary scenarios.';

  if (pct >= 80) {
    level = 'Advanced';
    score = 95;
    summary = skill.assessment.suggested_result_label_guidance?.advanced || 'Demonstrates advanced mastery and strong edge-case reasoning.';
  } else if (pct >= 55) {
    level = 'Proficient';
    score = 85;
    summary = skill.assessment.suggested_result_label_guidance?.proficient || 'Comfortable and autonomous in practical applications.';
  } else if (pct >= 25) {
    level = 'Developing';
    score = 65;
    summary = skill.assessment.suggested_result_label_guidance?.developing || 'Has good foundational knowledge, currently developing.';
  } else {
    level = 'Beginner';
    score = 40;
    summary = skill.assessment.suggested_result_label_guidance?.beginner || 'Familiar with core concepts, learning actively.';
  }

  return { level, score, summary, percentage: Math.round(pct) };
}
