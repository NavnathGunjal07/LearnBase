# AI-Accessible Project Rules

## 1. File Structure Rules

```yaml
rules:
  file_structure:
    frontend:
      - "src/api/ - API service layer"
      - "src/components/ - Reusable UI components"
      - "src/context/ - React context providers"
      - "src/hooks/ - Custom React hooks"
      - "src/pages/ - Page components"
      - "src/utils/ - Utility functions and types"
    backend:
      - "src/middleware/ - Express middleware"
      - "src/routes/ - API route handlers"
      - "src/services/ - Business logic"
      - "src/utils/ - Helper functions"
      - "prisma/ - Database schema and migrations"
```

## 2. Naming Conventions

```yaml
rules:
  naming:
    components: "PascalCase (e.g., ChatContainer.tsx)"
    hooks: "useCamelCase (e.g., useChat.ts)"
    variables: "camelCase"
    constants: "UPPER_SNAKE_CASE"
    interfaces: "IPrefix or TypeSuffix (e.g., IUser or UserType)"
    files: "kebab-case for non-component files"
    css_classes: "kebab-case"
```

## 3. Component Guidelines

```yaml
rules:
  components:
    structure:
      - "One component per file"
      - "Props interface at the top"
      - "Exported component follows"
      - "Helper functions after component"
    props:
      - "Required props first"
      - "Optional props with defaults"
      - "Destructure props at top of component"
    hooks:
      - "Use custom hooks for business logic"
      - "Keep effects minimal"
      - "Include dependencies array"
    state:
      - "Use useState for local state"
      - "Use context for global state"
      - "Keep state as local as possible"
```

## 4. API Integration Rules

```yaml
rules:
  api:
    services:
      - "One service per domain (auth, user, chat, etc.)"
      - "Use axiosInstance for all API calls"
      - "Handle errors consistently"
      - "Return typed responses"
    endpoints:
      - "Use RESTful conventions"
      - "Version API routes (/api/v1/...)"
      - "Use proper HTTP methods"
    authentication:
      - "Include auth token in headers"
      - "Handle token refresh"
      - "Redirect to login on 401"
```

## 5. Styling Rules

```yaml
rules:
  styling:
    approach: "Tailwind CSS with component composition"
    custom_components:
      - "Use shadcn/ui as base"
      - "Extend with custom styles"
    theming:
      - "Use CSS variables for theming"
      - "Dark mode support"
    responsive:
      - "Mobile-first approach"
      - "Use Tailwind breakpoints"
    spacing: "Use Tailwind's spacing scale (0.25rem = 1)"
```

## 6. State Management

```yaml
rules:
  state_management:
    local_state:
      - "Use useState for simple state"
      - "useReducer for complex state"
    global_state:
      - "React Context for app-wide state"
      - "Keep context providers minimal"
    server_state:
      - "Use React Query for server state"
      - "Implement caching and invalidation"
    form_state:
      - "Use React Hook Form"
      - "Zod for validation"
```

## 7. Error Handling

```yaml
rules:
  error_handling:
    client_side:
      - "Use error boundaries"
      - "Show user-friendly messages"
      - "Log errors to service"
    server_side:
      - "Use HTTP status codes"
      - "Include error codes"
      - "Provide helpful messages"
    validation:
      - "Client-side validation first"
      - "Server-side validation always"
      - "Show field-specific errors"
```

## 8. Performance

```yaml
rules:
  performance:
    rendering:
      - "Use React.memo() for expensive renders"
      - "Use useCallback for callbacks"
      - "Use useMemo for expensive calculations"
    loading:
      - "Show loading states"
      - "Use Suspense for code splitting"
      - "Implement skeleton loaders"
    assets:
      - "Optimize images"
      - "Lazy load non-critical assets"
      - "Use modern image formats"
```

## 9. Testing

```yaml
rules:
  testing:
    unit_tests:
      - "Test components in isolation"
      - "Test custom hooks"
      - "Test utility functions"
    integration_tests:
      - "Test component interactions"
      - "Test API integrations"
    e2e_tests:
      - "Test critical user flows"
      - "Run in CI/CD pipeline"
    coverage:
      - "Aim for 80%+ coverage"
      - "Focus on business logic"
```

## 10. Git & Version Control

```yaml
rules:
  git:
    branches:
      - "main: production"
      - "develop: development"
      - "feature/*: new features"
      - "bugfix/*: bug fixes"
    commits:
      - "Use conventional commits"
      - "Keep commits atomic"
      - "Write clear messages"
    pull_requests:
      - "Link to issues"
      - "Include screenshots"
      - "Get code review"
```

## 11. Code Quality

```yaml
rules:
  code_quality:
    linting:
      - "ESLint with TypeScript"
      - "Fix all warnings"
    formatting:
      - "Prettier for consistent formatting"
      - "Configured in .prettierrc"
    types:
      - "Use TypeScript strictly"
      - "No 'any' type"
      - "Define interfaces for API responses"
    documentation:
      - "JSDoc for functions"
      - "Component props documentation"
      - "Update README.md"
```

## 12. Security

```yaml
rules:
  security:
    authentication:
      - "Use HTTP-only cookies for tokens"
      - "Implement CSRF protection"
      - "Secure password hashing"
    api:
      - "Validate all inputs"
      - "Sanitize user inputs"
      - "Implement rate limiting"
    headers:
      - "Set security headers"
      - "Enable CORS properly"
      - "Use HTTPS"
```

## 13. Accessibility (a11y)

```yaml
rules:
  accessibility:
    semantic_html:
      - "Use proper HTML elements"
      - "Implement ARIA attributes"
    keyboard:
      - "All functionality keyboard accessible"
      - "Visible focus states"
    screen_readers:
      - "Provide text alternatives"
      - "Use proper heading hierarchy"
    color_contrast:
      - "Meet WCAG AA standards"
      - "Test with color contrast checkers"
```

## 14. Internationalization (i18n)

```yaml
rules:
  i18n:
    implementation:
      - "Use react-i18next"
      - "Store translations in JSON files"
    keys:
      - "Use namespaced keys"
      - "Keep translations flat"
    formatting:
      - "Handle plurals"
      - "Support date/number formatting"
```

## 15. Environment Configuration

```yaml
rules:
  environment:
    files:
      - ".env.local: Local overrides"
      - ".env.development: Development"
      - ".env.production: Production"
    variables:
      - "Prefix with VITE_ for Vite"
      - "Document all required variables"
      - "Never commit .env files"
```

## How to Use These Rules

1. **For AI Assistants**: These rules are structured in YAML format for easy parsing. Use them to guide code generation and refactoring.

2. **For Developers**: Follow these guidelines when contributing to the project to maintain consistency and quality.

3. **For Code Reviews**: Use these rules as a checklist during code reviews to ensure all contributions meet the project's standards.

## Updating These Rules

1. Make changes to the relevant YAML sections
2. Update the version number below
3. Document the changes in the CHANGELOG.md

**Version**: 1.0.0
**Last Updated**: 2025-11-08
