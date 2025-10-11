import { PrismaClient } from './generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Master Topics (Predefined topics)
  const masterTopics = [
    {
      name: 'JavaScript',
      slug: 'javascript',
      description: 'Learn modern JavaScript from basics to advanced concepts',
      category: 'Programming Language',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
      orderIndex: 1,
    },
    {
      name: 'Python',
      slug: 'python',
      description: 'Master Python programming for web development, data science, and automation',
      category: 'Programming Language',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg',
      orderIndex: 2,
    },
    {
      name: 'React',
      slug: 'react',
      description: 'Build modern, interactive user interfaces with React',
      category: 'Framework',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      orderIndex: 3,
    },
    {
      name: 'Node.js',
      slug: 'nodejs',
      description: 'Server-side JavaScript with Node.js',
      category: 'Runtime Environment',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Node.js_logo.svg',
      orderIndex: 4,
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      description: 'Typed superset of JavaScript for scalable applications',
      category: 'Programming Language',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/TypeScript_logo_2020.svg',
      orderIndex: 5,
    },
    {
      name: 'Vue.js',
      slug: 'vuejs',
      description: 'Progressive JavaScript framework for building UIs',
      category: 'Framework',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Vue.js_Logo_2.svg',
      orderIndex: 6,
    },
    {
      name: 'Angular',
      slug: 'angular',
      description: 'Platform for building mobile and desktop web applications',
      category: 'Framework',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Angular_logo.svg',
      orderIndex: 7,
    },
    {
      name: 'SQL',
      slug: 'sql',
      description: 'Database querying and management with SQL',
      category: 'Database',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/SQL_Logo.svg',
      orderIndex: 8,
    },
  ];
  

  for (const topic of masterTopics) {
    await prisma.masterTopic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: topic,
    });
  }

  console.log('✅ Master topics seeded!');

  // Create sample subtopics for JavaScript
  const jsTopic = await prisma.masterTopic.findUnique({ where: { slug: 'javascript' } });
  if (jsTopic) {
    const jsSubtopics = [
      { title: 'Variables and Data Types', difficultyLevel: 'basic', orderIndex: 1 },
      { title: 'Functions and Scope', difficultyLevel: 'basic', orderIndex: 2 },
      { title: 'Arrays and Objects', difficultyLevel: 'basic', orderIndex: 3 },
      { title: 'DOM Manipulation', difficultyLevel: 'intermediate', orderIndex: 4 },
      { title: 'Async/Await and Promises', difficultyLevel: 'intermediate', orderIndex: 5 },
      { title: 'ES6+ Features', difficultyLevel: 'intermediate', orderIndex: 6 },
      { title: 'Closures and Prototypes', difficultyLevel: 'advanced', orderIndex: 7 },
      { title: 'Design Patterns', difficultyLevel: 'advanced', orderIndex: 8 },
    ];

    for (const subtopic of jsSubtopics) {
      await prisma.subtopic.upsert({
        where: { 
          id: 0 // Dummy, will create new
        },
        update: {},
        create: {
          ...subtopic,
          masterTopicId: jsTopic.id,
          description: `Learn ${subtopic.title}`,
        },
      });
    }
      // console.log('✅ js sub topics seeded!');
  }

  // Create sample subtopics for Python
  const pyTopic = await prisma.masterTopic.findUnique({ where: { slug: 'python' } });
  if (pyTopic) {
    const pySubtopics = [
      { title: 'Python Basics', difficultyLevel: 'basic', orderIndex: 1 },
      { title: 'Data Structures', difficultyLevel: 'basic', orderIndex: 2 },
      { title: 'Functions and Modules', difficultyLevel: 'basic', orderIndex: 3 },
      { title: 'OOP in Python', difficultyLevel: 'intermediate', orderIndex: 4 },
      { title: 'File Handling', difficultyLevel: 'intermediate', orderIndex: 5 },
      { title: 'Decorators and Generators', difficultyLevel: 'advanced', orderIndex: 6 },
    ];

    for (const subtopic of pySubtopics) {
      await prisma.subtopic.create({
        data: {
          ...subtopic,
          masterTopicId: pyTopic.id,
          description: `Learn ${subtopic.title}`,
        },
      });
    }
  }

  // Create sample subtopics for React
  const reactTopic = await prisma.masterTopic.findUnique({ where: { slug: 'react' } });
  if (reactTopic) {
    const reactSubtopics = [
      { title: 'JSX and Components', difficultyLevel: 'basic', orderIndex: 1 },
      { title: 'Props and State', difficultyLevel: 'basic', orderIndex: 2 },
      { title: 'React Hooks', difficultyLevel: 'intermediate', orderIndex: 3 },
      { title: 'Context API', difficultyLevel: 'intermediate', orderIndex: 4 },
      { title: 'Custom Hooks', difficultyLevel: 'advanced', orderIndex: 5 },
      { title: 'Performance Optimization', difficultyLevel: 'advanced', orderIndex: 6 },
    ];

    for (const subtopic of reactSubtopics) {
      await prisma.subtopic.create({
        data: {
          ...subtopic,
          masterTopicId: reactTopic.id,
          description: `Learn ${subtopic.title}`,
        },
      });
    }
  }

  // Create sample subtopics for Node.js
const nodeTopic = await prisma.masterTopic.findUnique({ where: { slug: 'nodejs' } });
if (nodeTopic) {
  const nodeSubtopics = [
    { title: 'Node.js Fundamentals', difficultyLevel: 'basic', orderIndex: 1 },
    { title: 'Modules and NPM', difficultyLevel: 'basic', orderIndex: 2 },
    { title: 'Asynchronous Programming', difficultyLevel: 'intermediate', orderIndex: 3 },
    { title: 'Express.js and Routing', difficultyLevel: 'intermediate', orderIndex: 4 },
    { title: 'Middleware and Error Handling', difficultyLevel: 'intermediate', orderIndex: 5 },
    { title: 'File System and Streams', difficultyLevel: 'advanced', orderIndex: 6 },
    { title: 'REST APIs and Authentication', difficultyLevel: 'advanced', orderIndex: 7 },
    { title: 'Scaling and Deployment', difficultyLevel: 'advanced', orderIndex: 8 },
  ];

  for (const subtopic of nodeSubtopics) {
    await prisma.subtopic.create({
      data: {
        ...subtopic,
        masterTopicId: nodeTopic.id,
        description: `Learn ${subtopic.title}`,
      },
    });
  }
}

// Create sample subtopics for TypeScript
const tsTopic = await prisma.masterTopic.findUnique({ where: { slug: 'typescript' } });
if (tsTopic) {
  const tsSubtopics = [
    { title: 'TypeScript Basics', difficultyLevel: 'basic', orderIndex: 1 },
    { title: 'Types and Interfaces', difficultyLevel: 'basic', orderIndex: 2 },
    { title: 'Functions and Generics', difficultyLevel: 'intermediate', orderIndex: 3 },
    { title: 'Classes and Inheritance', difficultyLevel: 'intermediate', orderIndex: 4 },
    { title: 'Modules and Namespaces', difficultyLevel: 'intermediate', orderIndex: 5 },
    { title: 'Decorators and Advanced Types', difficultyLevel: 'advanced', orderIndex: 6 },
    { title: 'Type Narrowing and Utility Types', difficultyLevel: 'advanced', orderIndex: 7 },
    { title: 'TypeScript with Node and React', difficultyLevel: 'advanced', orderIndex: 8 },
  ];

  for (const subtopic of tsSubtopics) {
    await prisma.subtopic.create({
      data: {
        ...subtopic,
        masterTopicId: tsTopic.id,
        description: `Learn ${subtopic.title}`,
      },
    });
  }
}

// Create sample subtopics for Vue
const vueTopic = await prisma.masterTopic.findUnique({ where: { slug: 'vue' } });
if (vueTopic) {
  const vueSubtopics = [
    { title: 'Vue Basics and Instance', difficultyLevel: 'basic', orderIndex: 1 },
    { title: 'Directives and Data Binding', difficultyLevel: 'basic', orderIndex: 2 },
    { title: 'Components and Props', difficultyLevel: 'intermediate', orderIndex: 3 },
    { title: 'Computed Properties and Watchers', difficultyLevel: 'intermediate', orderIndex: 4 },
    { title: 'Vue Router and Navigation', difficultyLevel: 'intermediate', orderIndex: 5 },
    { title: 'Vuex for State Management', difficultyLevel: 'advanced', orderIndex: 6 },
    { title: 'Composition API and Reusability', difficultyLevel: 'advanced', orderIndex: 7 },
  ];

  for (const subtopic of vueSubtopics) {
    await prisma.subtopic.create({
      data: {
        ...subtopic,
        masterTopicId: vueTopic.id,
        description: `Learn ${subtopic.title}`,
      },
    });
  }
}

// Create sample subtopics for Angular
const angularTopic = await prisma.masterTopic.findUnique({ where: { slug: 'angular' } });
if (angularTopic) {
  const angularSubtopics = [
    { title: 'Angular Basics and CLI', difficultyLevel: 'basic', orderIndex: 1 },
    { title: 'Components, Templates, and Modules', difficultyLevel: 'basic', orderIndex: 2 },
    { title: 'Data Binding and Directives', difficultyLevel: 'intermediate', orderIndex: 3 },
    { title: 'Services and Dependency Injection', difficultyLevel: 'intermediate', orderIndex: 4 },
    { title: 'Routing and Navigation', difficultyLevel: 'intermediate', orderIndex: 5 },
    { title: 'Reactive Forms and Observables', difficultyLevel: 'advanced', orderIndex: 6 },
    { title: 'State Management and Performance', difficultyLevel: 'advanced', orderIndex: 7 },
  ];

  for (const subtopic of angularSubtopics) {
    await prisma.subtopic.create({
      data: {
        ...subtopic,
        masterTopicId: angularTopic.id,
        description: `Learn ${subtopic.title}`,
      },
    });
  }
}

// Create sample subtopics for SQL
const sqlTopic = await prisma.masterTopic.findUnique({ where: { slug: 'sql' } });
if (sqlTopic) {
  const sqlSubtopics = [
    { title: 'SQL Basics and Syntax', difficultyLevel: 'basic', orderIndex: 1 },
    { title: 'SELECT, INSERT, UPDATE, DELETE', difficultyLevel: 'basic', orderIndex: 2 },
    { title: 'WHERE, ORDER BY, and GROUP BY', difficultyLevel: 'intermediate', orderIndex: 3 },
    { title: 'JOINs and Subqueries', difficultyLevel: 'intermediate', orderIndex: 4 },
    { title: 'Indexes and Performance Optimization', difficultyLevel: 'advanced', orderIndex: 5 },
    { title: 'Stored Procedures and Transactions', difficultyLevel: 'advanced', orderIndex: 6 },
    { title: 'Database Design and Normalization', difficultyLevel: 'advanced', orderIndex: 7 },
  ];

  for (const subtopic of sqlSubtopics) {
    await prisma.subtopic.create({
      data: {
        ...subtopic,
        masterTopicId: sqlTopic.id,
        description: `Learn ${subtopic.title}`,
      },
    });
  }
}


  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  export default main;