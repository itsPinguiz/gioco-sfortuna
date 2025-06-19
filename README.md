[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #N: 1
## Student: s346595 Stefano Zizzi

## Overview

"Gioco della Sfortuna" is a web-based card game where players must evaluate and rank university-related misfortune situations. Players start with 3 cards and must correctly place new cards in order of their misfortune index to win. The goal is to collect 6 cards while having only 3 attempts per round.

## React Client Application Routes

- Route `/`: Home page with game introduction, rules explanation, and new game creation. Shows different content for authenticated vs guest users
- Route `/login`: Authentication page with login form and guest play option for demo games
- Route `/game/:gameId`: Main game page where the actual gameplay happens. Parameter `gameId` specifies which game instance to load
- Route `/games-history`: Protected route showing authenticated users their game history with detailed statistics and round information
- Route `*`: Catch-all route that redirects to home page for invalid URLs

## API Server

### Authentication Routes
- POST `/api/sessions`: User login
  - request body: `{ username: string, password: string }`
  - response: user object (without sensitive data) or error
- GET `/api/sessions/current`: Get current authenticated user
  - response: user object or 401 if not authenticated
- DELETE `/api/sessions/current`: User logout
  - response: empty object

### Game Routes
- POST `/api/games`: Create a new game
  - request body: none (user ID taken from session, null for guests)
  - response: `{ game: gameObject, cards: cardArray }`
- GET `/api/games`: Get games history for authenticated user
  - response: array of games with card counts and statistics
- GET `/api/games/:id`: Get specific game details with cards and rounds
  - request parameters: `id` (game ID)
  - response: `{ game: gameObject, cards: cardArray, rounds: roundArray }`
- GET `/api/games/:id/round`: Get a random card for the current round
  - request parameters: `id` (game ID)
  - response: card object without misfortune index
- POST `/api/games/:id/round`: Submit card placement for current round
  - request parameters: `id` (game ID)
  - request body: `{ cardId: number, position: number, timeTaken?: number }`
  - response: placement result with game status and statistics
- POST `/api/games/:id/end`: Manually end a game
  - request parameters: `id` (game ID)
  - request body: `{ result: string }`
  - response: updated game object

## Database Tables

- Table `users`: Stores user account information
  - `id` (INTEGER PRIMARY KEY): Unique user identifier
  - `email` (TEXT UNIQUE): User email address
  - `username` (TEXT UNIQUE): User login name
  - `password` (TEXT): Hashed password
  - `salt` (TEXT): Password salt for hashing

- Table `cards`: Contains all misfortune situation cards
  - `id` (INTEGER PRIMARY KEY): Unique card identifier
  - `name` (TEXT NOT NULL): Card title/description
  - `image_url` (TEXT NOT NULL): Path to card image
  - `misfortune_index` (REAL NOT NULL): Misfortune rating (1-100)

- Table `games`: Stores game instances and their state
  - `id` (INTEGER PRIMARY KEY): Unique game identifier
  - `user_id` (INTEGER): Reference to users table (NULL for guest games)
  - `start_date` (DATETIME NOT NULL): When the game started
  - `end_date` (DATETIME): When the game ended
  - `result` (TEXT): Game outcome ('won' or 'lost')
  - `incorrect_attempts` (INTEGER DEFAULT 0): Number of wrong placements

- Table `game_cards`: Links cards to games in order
  - `id` (INTEGER PRIMARY KEY): Unique relationship identifier
  - `game_id` (INTEGER NOT NULL): Reference to games table
  - `card_id` (INTEGER NOT NULL): Reference to cards table
  - `acquisition_order` (INTEGER NOT NULL): Order in which card was obtained

- Table `game_rounds`: Tracks individual round attempts
  - `id` (INTEGER PRIMARY KEY): Unique round identifier
  - `game_id` (INTEGER NOT NULL): Reference to games table
  - `round_number` (INTEGER NOT NULL): Sequential round number
  - `presented_card_id` (INTEGER NOT NULL): Card shown to player
  - `chosen_position` (INTEGER NOT NULL): Position chosen by player (-1 for timeout)
  - `correct_position` (INTEGER NOT NULL): Actual correct position
  - `is_correct` (BOOLEAN NOT NULL): Whether placement was correct
  - `time_taken` (INTEGER): Time in seconds to make decision
  - `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP): Round timestamp

## Database Reset

The application supports database reset through command-line arguments:

- `npm start -- --reset-db` or `npm start -- --reset`: Resets the database before starting the server
- To always reset the database on startup, uncomment the `await resetDB();` line in `server/index.mjs`

**Warning**: Database reset will delete all existing data and recreate the schema with sample data.

## Main React Components

- `App` (in `App.jsx`): Main application component that sets up routing, authentication context, and global layout
- `HomePage` (in `HomePage.jsx`): Landing page component with game introduction, rules, and new game creation. Handles different UI for authenticated vs guest users
- `LoginPage` (in `LoginPage.jsx`): Authentication page with login form validation and guest demo game option
- `GamePage` (in `GamePage.jsx`): Core game component orchestrating the entire game flow using custom hooks for state and timer management
- `GamesHistoryPage` (in `GamesHistoryPage.jsx`): Protected page showing authenticated users their complete game history with detailed statistics
- `NavbarComponent` (in `components/layout/Navbar.jsx`): Navigation bar with authentication status and navigation links
- `CardHand` (in `components/game/CardHand.jsx`): Displays the player's current collection of cards, optionally showing misfortune indices
- `GameRound` (in `components/game/GameRound.jsx`): Handles the active round gameplay including card placement and timer display
- `GameResult` (in `components/game/GameResult.jsx`): Shows the result of a round attempt with feedback and continuation options
- `GameOver` (in `components/game/GameOver.jsx`): Final game screen showing complete statistics and offering new game option
- `AuthProvider` (in `contexts/AuthContext.jsx`): Authentication context provider managing user login state and authentication flows
- `ProtectedRoute` (in `components/common/ProtectedRoute.jsx`): Route wrapper that redirects unauthenticated users to login page
- `Footer` (in `components/layout/Footer.jsx`): Application footer with university and course information

## Custom Hooks

- `useGameState` (in `hooks/useGameState.js`): Manages complete game state including phases, card management, and API interactions
- `useGameTimer` (in `hooks/useGameTimer.js`): Handles game timer functionality with localStorage persistence for resuming games

## Screenshots

![Screenshot Partita](./img/game_in_progress.jpg)
![Screenshot Storico](./img/game_history.jpg)

## Users Credentials

- user1, P@ssw0rd1
- user2, P@ssw0rd2
