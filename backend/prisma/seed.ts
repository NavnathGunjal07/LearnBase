import { PrismaClient } from "./generated/client/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Master Topics (Predefined topics)
  const masterTopics = [
    {
      name: "JavaScript",
      slug: "javascript",
      description: "Learn modern JavaScript from basics to advanced concepts",
      category: "Programming Language",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png",
      orderIndex: 1,
      weightage: 100,
    },
    {
      name: "Python",
      slug: "python",
      description:
        "Master Python programming for web development, data science, and automation",
      category: "Programming Language",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
      orderIndex: 2,
      weightage: 100,
    },
    {
      name: "React",
      slug: "react",
      description: "Build modern, interactive user interfaces with React",
      category: "Framework",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      orderIndex: 3,
      weightage: 100,
    },
    {
      name: "Node.js",
      slug: "nodejs",
      description: "Server-side JavaScript with Node.js",
      category: "Runtime Environment",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/8/8d/Node.js_logo.svg",
      orderIndex: 4,
      weightage: 100,
    },
    {
      name: "TypeScript",
      slug: "typescript",
      description: "Typed superset of JavaScript for scalable applications",
      category: "Programming Language",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/4/4e/TypeScript_logo_2020.svg",
      orderIndex: 5,
      weightage: 100,
    },
    {
      name: "Vue.js",
      slug: "vuejs",
      description: "Progressive JavaScript framework for building UIs",
      category: "Framework",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/95/Vue.js_Logo_2.svg",
      orderIndex: 6,
      weightage: 100,
    },
    {
      name: "Angular",
      slug: "angular",
      description: "Platform for building mobile and desktop web applications",
      category: "Framework",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/90/Angular_logo.svg",
      orderIndex: 7,
      weightage: 100,
    },
    {
      name: "SQL",
      slug: "sql",
      description: "Database querying and management with SQL",
      category: "Database",
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/64/SQL_Logo.svg",
      orderIndex: 8,
      weightage: 100,
    },
  ];

  for (const topic of masterTopics) {
    await prisma.masterTopic.upsert({
      where: { slug: topic.slug },
      update: { weightage: topic.weightage },
      create: topic,
    });
  }

  console.log("✅ Master topics seeded!");

  // Helper to seed subtopics
  const seedSubtopics = async (slug: string, subtopics: any[]) => {
    const topic = await prisma.masterTopic.findUnique({ where: { slug } });
    if (topic) {
      for (const subtopic of subtopics) {
        // We use a composite unique key conceptually, but schema only has ID.
        // For seeding, we'll check if a subtopic with this title exists for this master topic.
        const existing = await prisma.subtopic.findFirst({
          where: {
            masterTopicId: topic.id,
            title: subtopic.title,
          },
        });

        if (existing) {
          await prisma.subtopic.update({
            where: { id: existing.id },
            data: {
              ...subtopic,
              description: subtopic.description || `Learn ${subtopic.title}`,
            },
          });
        } else {
          await prisma.subtopic.create({
            data: {
              ...subtopic,
              masterTopicId: topic.id,
              description: subtopic.description || `Learn ${subtopic.title}`,
            },
          });
        }
      }
      console.log(`✅ ${slug} subtopics seeded!`);
    }
  };

  // JavaScript Subtopics
  await seedSubtopics("javascript", [
    {
      title: "Variables and Data Types",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "Operators and Expressions",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 5,
    },
    {
      title: "Control Flow (if/else, switch)",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 5,
    },
    {
      title: "Loops and Iteration",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 5,
    },
    {
      title: "Functions (Declarations, Expressions, Arrow)",
      difficultyLevel: "basic",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Scope and Hoisting",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 5,
    },
    {
      title: "Arrays and Array Methods",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 10,
    },
    {
      title: "Objects and Object Methods",
      difficultyLevel: "intermediate",
      orderIndex: 8,
      weightage: 10,
    },
    {
      title: "DOM Manipulation",
      difficultyLevel: "intermediate",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "Events and Event Handling",
      difficultyLevel: "intermediate",
      orderIndex: 10,
      weightage: 10,
    },
    {
      title: "Asynchronous JavaScript (Callbacks, Promises)",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
    {
      title: "Async/Await",
      difficultyLevel: "advanced",
      orderIndex: 12,
      weightage: 5,
    },
    {
      title: "ES6+ Features (Destructuring, Spread, Modules)",
      difficultyLevel: "advanced",
      orderIndex: 13,
      weightage: 5,
    },
    {
      title: "Error Handling and Debugging",
      difficultyLevel: "advanced",
      orderIndex: 14,
      weightage: 5,
    },
  ]);

  // Python Subtopics
  await seedSubtopics("python", [
    {
      title: "Python Syntax and Variables",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "Data Types (Numbers, Strings, Booleans)",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 5,
    },
    {
      title: "Control Structures (if, for, while)",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 10,
    },
    {
      title: "Functions and Modules",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 10,
    },
    {
      title: "Lists, Tuples, and Sets",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Dictionaries",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 10,
    },
    {
      title: "File Handling",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 5,
    },
    {
      title: "Object-Oriented Programming (Classes, Objects)",
      difficultyLevel: "advanced",
      orderIndex: 8,
      weightage: 15,
    },
    {
      title: "Inheritance and Polymorphism",
      difficultyLevel: "advanced",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "Exception Handling",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 5,
    },
    {
      title: "Decorators and Generators",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
    {
      title: "Python Standard Library",
      difficultyLevel: "advanced",
      orderIndex: 12,
      weightage: 5,
    },
  ]);

  // React Subtopics
  await seedSubtopics("react", [
    {
      title: "Introduction to JSX",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "Components (Functional vs Class)",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 10,
    },
    {
      title: "Props and PropTypes",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 5,
    },
    {
      title: "State and useState Hook",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 10,
    },
    {
      title: "Effect Hook (useEffect)",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Handling Events",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 5,
    },
    {
      title: "Conditional Rendering",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 5,
    },
    {
      title: "Lists and Keys",
      difficultyLevel: "intermediate",
      orderIndex: 8,
      weightage: 5,
    },
    {
      title: "Forms and Controlled Components",
      difficultyLevel: "intermediate",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "Context API",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 10,
    },
    {
      title: "React Router",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
    {
      title: "Custom Hooks",
      difficultyLevel: "advanced",
      orderIndex: 12,
      weightage: 10,
    },
    {
      title: "Performance Optimization (Memo, useMemo, useCallback)",
      difficultyLevel: "advanced",
      orderIndex: 13,
      weightage: 5,
    },
  ]);

  // Node.js Subtopics
  await seedSubtopics("nodejs", [
    {
      title: "Node.js Architecture & Event Loop",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 10,
    },
    {
      title: "Modules (CommonJS vs ES Modules)",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 5,
    },
    {
      title: "NPM and package.json",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 5,
    },
    {
      title: "File System (fs module)",
      difficultyLevel: "intermediate",
      orderIndex: 4,
      weightage: 10,
    },
    {
      title: "Events and EventEmitter",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 5,
    },
    {
      title: "Streams and Buffers",
      difficultyLevel: "advanced",
      orderIndex: 6,
      weightage: 10,
    },
    {
      title: "HTTP Module & Creating a Server",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 10,
    },
    {
      title: "Express.js Framework Basics",
      difficultyLevel: "intermediate",
      orderIndex: 8,
      weightage: 10,
    },
    {
      title: "Middleware in Express",
      difficultyLevel: "advanced",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "REST API Development",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 15,
    },
    {
      title: "Authentication (JWT, Sessions)",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
  ]);

  // TypeScript Subtopics
  await seedSubtopics("typescript", [
    {
      title: "TypeScript Basics & Configuration",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "Basic Types (string, number, boolean, etc.)",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 5,
    },
    {
      title: "Interfaces and Type Aliases",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 10,
    },
    {
      title: "Functions and Typing",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 5,
    },
    {
      title: "Classes and Access Modifiers",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Generics",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 15,
    },
    {
      title: "Enums and Tuples",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 5,
    },
    {
      title: "Union and Intersection Types",
      difficultyLevel: "intermediate",
      orderIndex: 8,
      weightage: 5,
    },
    {
      title: "Type Narrowing and Guards",
      difficultyLevel: "advanced",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "Utility Types (Partial, Pick, Omit, etc.)",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 10,
    },
    {
      title: "Decorators",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
    {
      title: "Advanced Configuration (tsconfig)",
      difficultyLevel: "advanced",
      orderIndex: 12,
      weightage: 10,
    },
  ]);

  // Vue.js Subtopics
  await seedSubtopics("vuejs", [
    {
      title: "Vue Instance and Lifecycle",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 10,
    },
    {
      title: "Template Syntax and Directives",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 10,
    },
    {
      title: "Computed Properties and Watchers",
      difficultyLevel: "intermediate",
      orderIndex: 3,
      weightage: 10,
    },
    {
      title: "Class and Style Bindings",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 5,
    },
    {
      title: "Components Basics",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Props and Events",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 10,
    },
    {
      title: "Slots and Dynamic Components",
      difficultyLevel: "advanced",
      orderIndex: 7,
      weightage: 10,
    },
    {
      title: "Vue Router",
      difficultyLevel: "advanced",
      orderIndex: 8,
      weightage: 10,
    },
    {
      title: "State Management (Vuex/Pinia)",
      difficultyLevel: "advanced",
      orderIndex: 9,
      weightage: 15,
    },
    {
      title: "Composition API",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 10,
    },
  ]);

  // Angular Subtopics
  await seedSubtopics("angular", [
    {
      title: "Angular CLI and Project Structure",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "Components and Templates",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 10,
    },
    {
      title: "Data Binding (Interpolation, Property, Event)",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 10,
    },
    {
      title: "Directives (Structural & Attribute)",
      difficultyLevel: "intermediate",
      orderIndex: 4,
      weightage: 10,
    },
    {
      title: "Pipes",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 5,
    },
    {
      title: "Services and Dependency Injection",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 15,
    },
    {
      title: "Routing and Navigation",
      difficultyLevel: "advanced",
      orderIndex: 7,
      weightage: 10,
    },
    {
      title: "Forms (Template-driven & Reactive)",
      difficultyLevel: "advanced",
      orderIndex: 8,
      weightage: 15,
    },
    {
      title: "HTTP Client and Observables (RxJS)",
      difficultyLevel: "advanced",
      orderIndex: 9,
      weightage: 15,
    },
    {
      title: "Modules and Lazy Loading",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 5,
    },
  ]);

  // SQL Subtopics
  await seedSubtopics("sql", [
    {
      title: "Introduction to Databases & RDBMS",
      difficultyLevel: "basic",
      orderIndex: 1,
      weightage: 5,
    },
    {
      title: "SQL Syntax Basics",
      difficultyLevel: "basic",
      orderIndex: 2,
      weightage: 5,
    },
    {
      title: "SELECT Statement and Filtering (WHERE)",
      difficultyLevel: "basic",
      orderIndex: 3,
      weightage: 10,
    },
    {
      title: "Sorting and Limiting Results",
      difficultyLevel: "basic",
      orderIndex: 4,
      weightage: 5,
    },
    {
      title: "Aggregate Functions (COUNT, SUM, AVG)",
      difficultyLevel: "intermediate",
      orderIndex: 5,
      weightage: 10,
    },
    {
      title: "Grouping Data (GROUP BY, HAVING)",
      difficultyLevel: "intermediate",
      orderIndex: 6,
      weightage: 10,
    },
    {
      title: "Joins (INNER, LEFT, RIGHT, FULL)",
      difficultyLevel: "intermediate",
      orderIndex: 7,
      weightage: 15,
    },
    {
      title: "Subqueries",
      difficultyLevel: "advanced",
      orderIndex: 8,
      weightage: 10,
    },
    {
      title: "Data Modification (INSERT, UPDATE, DELETE)",
      difficultyLevel: "intermediate",
      orderIndex: 9,
      weightage: 10,
    },
    {
      title: "Table Creation and Constraints",
      difficultyLevel: "advanced",
      orderIndex: 10,
      weightage: 10,
    },
    {
      title: "Normalization and Indexes",
      difficultyLevel: "advanced",
      orderIndex: 11,
      weightage: 10,
    },
  ]);

  console.log("✅ Seeding completed successfully!");
}

// main()
//   .catch((e) => {
//     console.error("❌ Seeding failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

export default main;
