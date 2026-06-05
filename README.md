# IFTest - Interactive Fiction World Builder

A React + TypeScript app for managing interactive fiction kinds, rulebooks, and relations with a Supabase backend.

## Features

- **Kinds Browser**: View kinds and value kinds in a hierarchical tree
- **Kind Editor**: Inspect kind details and edit JSON properties
- **Rulebook Management**: Browse rulebooks and inspect assertion-backed metadata
- **Relation Management**: Browse relations and view relation verb mappings
- **Story Assertions Editor**: Edit the Story box in Monaco
- **Dry-run Preview**: Preview SQL-like updates and inserts before applying them
- **Supabase Sync**: Load Kinds, Rulebooks, Relations, and assertion views from Supabase

## Getting Started

### Prerequisites
- Node.js 16+
- A Supabase project configured with the expected tables/views

### Installation

1. Clone the repository
```bash
git clone https://github.com/2lindell/IFTest.git
cd IFTest
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open the app
```bash
http://localhost:3000
```

## Project Structure

```
src/
├── components/                  # React UI components
│   ├── KindsTree.tsx
│   ├── KindEditor.tsx
│   ├── RulebooksList.tsx
│   ├── RulebookEditor.tsx
│   ├── RelationsList.tsx
│   ├── RelationEditor.tsx
│   └── StoryBox.tsx
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   └── types.ts                 # Shared TypeScript types
├── store/
│   └── worldStore.ts            # Zustand state management
├── App.tsx                      # Main application shell
└── index.css                    # Tailwind styles
```

## Supabase Views / Tables

The app currently reads from these Supabase sources:

- `Kinds`
- `Kinds of Value`
- `Rulebooks`
- `Rulebook Assertions`
- `Relations`
- `Relation Assertions`
- `Relation Verb Assertions`

The Story editor is designed to edit and preview changes to the declaration text stored in these views.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies

- **React 18** - UI framework
- **TypeScript** - Static typing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - backend/database access
- **Zustand** - state management
- **Monaco Editor** - embedded code editor
- **Lucide Icons** - icon set

## License

MIT
