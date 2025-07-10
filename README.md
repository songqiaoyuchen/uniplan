## Project Structure

### app/

Contains Next.js `app/` directory features such as:

- `api/` — API route handlers (e.g., `route.ts`)
- `components/` — Reusable UI components

### services/

Client-side API callers that fetch data from backend endpoints.

- `planner/` — Planner-related API callers (e.g., fetch module graph)
- `user/` — (Future) User-related API callers (e.g., user profile)

### db/

Handles connection and query logic for databases.

- `neo4j.ts` — Neo4j driver setup
- `[query].ts` — Reusable query functions (e.g., `getModuleTree.ts`)

> If using multiple databases (e.g., Neo4j and PostgreSQL), this directory can include subfolders like `neo4j/` and `postgres/` for clarity.

### scripts/

One-time or scheduled scripts to populate or manipulate database content.

- `neo4j/` — Cipher queries to insert/update/delete nodes and relationships in Neo4j
- `scrapers/` — Code to pull external data from NUSMods to feed into the graph

> These scripts are not part of the app runtime and can be run manually or via CLI.

### utils/

General-purpose helper functions shared across frontend/backend, such as:

- Graph transformation (e.g., formatting Neo4j output)
- Data sanitization or formatting

### temp/

Temporary functions that I am not sure what for.

## Styling Guidelines

Please adhere to the following styling guidelines:

### 1. Use Double Quotes (`"`) for Strings

- Always use double quotes (`"`) for strings in JSX and TypeScript files, except when using template literals or when single quotes (`'`) are part of the string content.
- Example:
  ```typescript
  const title = "Welcome to the Planner!";
  const greeting = `Hello, it's ${user.name}'s schedule!`;
  ```

### 14. Define Functions Using the `function` Keyword

- Always define functions using the `function` keyword instead of `const` to improve readability and hoisting behavior.
- Example:

  ```typescript
  // Preferred
  function calculateTotal(a: number, b: number): number {
    return a + b;
  }

  // Avoid
  const calculateTotal = (a: number, b: number): number => {
    return a + b;
  };
  ```

### 2. Use MUI's `sx` Prop for Inline Styling

- Leverage the `sx` prop for styling individual components instead of inline styles or separate classes.
- Example:
  ```typescript
  <Box sx={{ margin: 2, padding: 1, backgroundColor: "primary.main" }}>
    Content goes here
  </Box>
  ```

### 3. Centralize Theme Configuration

- Define a global theme in the `theme.ts` file for shared styles like colors, typography, and spacing. Use the `theme` wherever applicable to ensure consistency.

### 4. Responsive Design

- Use MUI's `breakpoints` for responsiveness. Avoid hardcoding media queries and leverage the theme’s breakpoint system.
  ```typescript
  sx={{
    display: "flex",
    flexDirection: { xs: "column", md: "row" },
  }}
  ```

### 5. Component-Specific Styles

- Keep styles closely tied to components by placing styles in the component folder. Use MUI's `styled` API or `makeStyles` for more complex styling.

  ```typescript
  // Example in ComponentName/style.ts
  import { styled } from "@mui/material/styles";

  export const StyledButton = styled("button")(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(2),
  }));
  ```

### 6. Avoid Overriding MUI Classes Directly

- Instead of targeting MUI classes for styling overrides, use MUI's customization features like `components` in the theme or the `sx` prop.

### 7. Typography Standards

- Use the `Typography` component for all text. Avoid hardcoding font sizes, colors, or weights directly. Stick to variants defined in the theme.
  ```typescript
  <Typography variant="h4" color="textPrimary">
    Welcome to the Planner!
  </Typography>
  ```

### 8. Avoid Overly Nested Styles

- Keep styles flat and avoid deeply nested selectors. This makes it easier to read and maintain.

### 9. Consistent Naming

- Use clear and descriptive names for styled components, following the format `<ComponentName>Styled` or `<StyledComponentName>`.

### 10. Spacing and Layout

- Use the theme’s `spacing` function rather than hardcoded values for margins, paddings, and gaps.
  ```typescript
  sx={{ margin: theme.spacing(2), padding: theme.spacing(1) }}
  ```

### 11. Color Usage

- Use the theme palette (`theme.palette`) for all colors. Avoid hardcoding color codes directly unless absolutely necessary.

### 12. Dark Mode Support

- Test your styles for both light and dark mode to ensure proper contrast and usability.

### 13. Consistency in Component Props

- When applying custom styles to components like `Button`, use props such as `size`, `variant`, or `color` before resorting to custom `sx` props.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
