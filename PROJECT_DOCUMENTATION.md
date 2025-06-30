# 🎮 Gioco della Sfortuna - Documentazione Tecnica Completa

## 🏗️ Architettura del Sistema

### 📁 Struttura dei File
```
📦 esame1-gioco-sfortuna-itsPinguiz/
├── 📁 client/                    # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 api/              # Gestione API
│   │   ├── 📁 components/       # Componenti React
│   │   ├── 📁 contexts/         # Context per autenticazione
│   │   ├── 📁 hooks/           # Custom hooks
│   │   ├── 📁 pages/           # Pagine principali
│   │   └── 📁 utils/           # Utilità varie
│   └── 📁 tests/               # Test E2E e integrazione
├── 📁 server/                   # Backend Express.js
│   ├── 📁 db/                  # Database e DAO
│   ├── 📁 data/                # Dati di esempio
│   ├── 📁 public/              # File statici (immagini carte)
│   └── 📁 test/                # Test del server
└── 📁 img/                     # Screenshot per documentazione
```

### 🔧 Stack Tecnologico

#### Frontend
- **React 19.1.0**: Framework principale
- **React Router DOM 7.6.1**: Routing
- **Bootstrap 5.3.6**: Styling e componenti UI
- **@dnd-kit**: Drag & Drop per il gameplay
- **Axios**: Client HTTP per API calls
- **Vite**: Build tool e dev server

#### Backend
- **Node.js + Express.js**: Server web
- **SQLite3**: Database locale
- **Passport.js**: Autenticazione
- **express-session**: Gestione sessioni
- **CORS**: Cross-Origin Resource Sharing

---

## 📊 Diagrammi UML - Architettura e Flussi

### 🏛️ 1. Diagramma delle Classi (Class Diagram)
```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string password
        +string salt
        +getUserById(id)
        +getUserByUsername(username)
        +checkCredentials(username, password)
        +addUser(userData)
    }
    
    class Card {
        +int id
        +string name
        +string image_url
        +float misfortune_index
        +getAllCards()
        +getCardById(id)
        +getRandomCards(count, excludeIds)
        +addCard(cardData)
    }
    
    class Game {
        +int id
        +int user_id
        +datetime start_date
        +datetime end_date
        +string result
        +int incorrect_attempts
        +createGame(userId)
        +endGame(gameId, result)
        +getGameById(id)
        +getUserGames(userId)
        +incrementIncorrectAttempts(gameId)
    }
    
    class GameCard {
        +int id
        +int game_id
        +int card_id
        +int acquisition_order
        +addCardToGame(gameId, cardId, order)
        +getGameCards(gameId)
    }
    
    class GameRound {
        +int id
        +int game_id
        +int round_number
        +int presented_card_id
        +int chosen_position
        +int correct_position
        +bool is_correct
        +int time_taken
        +datetime created_at
        +recordGameRound(...)
        +getGameRounds(gameId)
    }
    
    class GamePage {
        +useState gameId
        +useState loading
        +useState error
        +useGameState()
        +useGameTimer()
        +onPlaceCard()
        +onContinue()
        +onNewGame()
    }
    
    class GameRoundComponent {
        +useState insertPosition
        +useState previewCards
        +DndContext
        +handleDragEnd()
        +handleConfirm()
        +handleTimeout()
    }
    
    class GameOver {
        +formatDate()
        +formatTime()
        +GameOverHeader
        +GameOverStats
        +RoundDetails
    }
    
    class useGameState {
        +useState gamePhase
        +useState roundCard
        +useState roundResult
        +loadRoundCard()
        +handlePlaceCard()
        +handleTimeout()
    }
    
    class useGameTimer {
        +useState timeLeft
        +useState isActive
        +startTimer()
        +stopTimer()
        +resetTimer()
        +pauseTimer()
    }
    
    User --o Game : "owns"
    Game --o GameCard : "contains"
    Game --o GameRound : "has_rounds"
    Card --o GameCard : "used_in"
    Card --o GameRound : "presented_in"
    
    GamePage --> useGameState : "uses"
    GamePage --> useGameTimer : "uses"
    GamePage --> GameRoundComponent : "renders"
    GamePage --> GameOver : "renders"
    
    useGameState --> Game : "manages"
    useGameTimer --> GameRoundComponent : "provides_timer"
```
### 🔄 2. Diagramma di Sequenza - Creazione Partita

```mermaid
sequenceDiagram
    participant U as User
    participant HP as HomePage
    participant API as Server API
    participant GDao as GameDAO
    participant CDao as CardDAO
    participant DB as Database
    participant GP as GamePage
    
    U->>HP: Click "Nuova Partita"
    HP->>API: POST /api/games
    API->>GDao: createGame(userId)
    GDao->>DB: INSERT INTO games
    DB-->>GDao: gameId
    API->>CDao: getUniqueRandomCards(3)
    CDao->>DB: SELECT * FROM cards ORDER BY RANDOM() LIMIT 3
    DB-->>CDao: [card1, card2, card3]
    API->>GDao: addCardToGame() x3
    GDao->>DB: INSERT INTO game_cards x3
    API-->>HP: {game, cards}
    HP->>GP: navigate(/game/:id)
    GP->>API: GET /api/games/:id
    API-->>GP: gameData
    GP->>GP: setGamePhase('round')
```

### 🎮 3. Diagramma di Sequenza - Round di Gioco

```mermaid
sequenceDiagram
    participant U as User
    participant GR as GameRound
    participant GT as GameTimer
    participant GS as GameState
    participant API as Server API
    participant GDao as GameDAO
    
    GS->>API: GET /api/games/:id/round
    API-->>GS: newCard (without misfortune_index)
    GS->>GR: setRoundCard(card)
    GS->>GT: startTimer(30s)
    
    alt User places card in time
        U->>GR: Drag & Drop card
        GR->>GR: setInsertPosition(pos)
        U->>GR: Click "Conferma"
        GR->>GT: stopTimer()
        GR->>GS: handlePlaceCard(cardId, position)
        GS->>API: POST /api/games/:id/round
        API->>GDao: recordGameRound(...)
        API->>GDao: calculateCorrectPosition()
        alt Correct placement
            API-->>GS: {result: 'correct', gameCompleted: false}
            GS->>GR: setRoundResult('correct')
        else Incorrect placement
            API-->>GS: {result: 'incorrect', correctPosition, incorrectAttempts}
            GS->>GR: setRoundResult('incorrect')
        end
    else Timer expires
        GT->>GS: handleTimeout()
        GS->>API: POST /api/games/:id/round {position: -1}
        API-->>GS: {result: 'incorrect', ...}
    end
```

### 🏛️ 4. Diagramma dell'Architettura del Sistema

```mermaid
graph TB
    subgraph "CLIENT (React + Vite)"
        subgraph "Pages"
            HP[HomePage]
            LP[LoginPage] 
            GP[GamePage]
            GHP[GamesHistoryPage]
        end
        
        subgraph "Components"
            GR[GameRound]
            GO[GameOver]
            CH[CardHand]
            MC[MisfortuneCard]
        end
        
        subgraph "Hooks"
            GS[useGameState]
            GT[useGameTimer]
        end
        
        subgraph "Context"
            AC[AuthContext]
        end
        
        subgraph "API Layer"
            API[API.js]
        end
    end
    
    subgraph "SERVER (Express + Node.js)"
        subgraph "Routes"
            AR[Auth Routes]
            GRR[Game Routes]
        end
        
        subgraph "Middleware"
            CORS[CORS]
            SESS[Session]
            PASS[Passport]
        end
        
        subgraph "DAOs"
            UD[UserDAO]
            CD[CardDAO] 
            GD[GameDAO]
        end
        
        subgraph "Database"
            DB[(SQLite)]
        end
    end
    
    %% Connections
    HP --> API
    GP --> GS
    GP --> GT
    GS --> API
    API --> GRR
    GRR --> GD
    GD --> DB
    CD --> DB
    UD --> DB
```

### 🎯 5. Diagramma di Stato - Game Phase

```mermaid
stateDiagram-v2
    [*] --> loading : Initialize Game
    
    loading --> round : Game Loaded Successfully
    loading --> error : Load Error
    
    round --> loading : Load Round Card
    loading --> round : Card Loaded
    
    round --> result : Card Placed/Timeout
    result --> round : Continue (< 6 cards, < 3 errors)
    result --> over : Game Won (6 cards)
    result --> over : Game Lost (3 errors)
    result --> over : Guest Game End
    
    over --> [*] : New Game
    error --> [*] : Restart
    
    note right of round
        Timer: 30 seconds
        User can drag & drop
        Timeout handling
    end note
    
    note right of result
        Show correct/incorrect
        Display statistics
        Continue button
    end note
```

### ⏱️ 6. Diagramma di Sequenza - Gestione Timer

```mermaid
sequenceDiagram
    participant GR as GameRound
    participant GT as useGameTimer
    participant LS as localStorage
    participant GS as useGameState
    
    GR->>GT: startTimer(30)
    GT->>LS: Save timer state
    GT->>GT: setInterval countdown
    
    loop Every second
        GT->>GT: timeLeft--
        GT->>LS: Update saved time
        GT->>GR: Display timeLeft
    end
    
    alt Timer reaches 0
        GT->>GS: Timeout detected
        GS->>GS: handleTimeout()
        GS->>GS: Submit position: -1
    else User places card
        GR->>GT: stopTimer()
        GT->>LS: Clear timer state
    else Page reload
        GT->>LS: Restore timer state
        GT->>GT: Resume countdown
    end
```

### 🔐 7. Diagramma di Sequenza - Autenticazione

```mermaid
sequenceDiagram
    participant U as User
    participant LP as LoginPage
    participant AC as AuthContext
    participant API as Server
    participant PASS as Passport
    participant UD as UserDAO
    
    U->>LP: Enter credentials
    LP->>API: POST /api/sessions
    API->>PASS: authenticate('local')
    PASS->>UD: checkCredentials()
    UD->>UD: Compare hashed passwords
    
    alt Valid credentials
        UD-->>PASS: user object
        PASS-->>API: user
        API-->>LP: user data
        LP->>AC: setUser(user)
        AC->>AC: setIsAuthenticated(true)
        LP->>LP: navigate('/')
    else Invalid credentials
        UD-->>PASS: null
        PASS-->>API: error
        API-->>LP: 401 error
        LP->>LP: show error message
    end
```

### 📊 8. Diagramma ER (Entity Relationship)

```mermaid
erDiagram
    USERS {
        int id PK
        string username UK
        string password
        string salt
    }
    
    CARDS {
        int id PK
        string name
        string image_url
        float misfortune_index
    }
    
    GAMES {
        int id PK
        int user_id FK
        datetime start_date
        datetime end_date
        string result
        int incorrect_attempts
    }
    
    GAME_CARDS {
        int id PK
        int game_id FK
        int card_id FK
        int acquisition_order
    }
    
    GAME_ROUNDS {
        int id PK
        int game_id FK
        int round_number
        int presented_card_id FK
        int chosen_position
        int correct_position
        bool is_correct
        int time_taken
        datetime created_at
    }
    
    USERS ||--o{ GAMES : owns
    GAMES ||--o{ GAME_CARDS : contains
    GAMES ||--o{ GAME_ROUNDS : has
    CARDS ||--o{ GAME_CARDS : used_in
    CARDS ||--o{ GAME_ROUNDS : presented_in
```

### 🎮 9. Diagramma Casi d'Uso

```mermaid
graph LR
    subgraph "Sistema Gioco della Sfortuna"
        UC1[Registrazione/Login]
        UC2[Crea Nuova Partita]
        UC3[Gioca Round]
        UC4[Posiziona Carta]
        UC5[Gestisci Timer]
        UC6[Visualizza Risultato]
        UC7[Termina Partita]
        UC8[Visualizza Storico]
        UC9[Gioca Demo Guest]
    end
    
    AU[Utente Autenticato]
    GU[Utente Guest]
    SYS[Sistema]
    
    AU --> UC1
    AU --> UC2
    AU --> UC3
    AU --> UC4
    AU --> UC5
    AU --> UC6
    AU --> UC7
    AU --> UC8
    
    GU --> UC9
    GU --> UC3
    GU --> UC4
    GU --> UC5
    GU --> UC6
    
    UC5 --> SYS
    UC6 --> SYS
```

### 📱 Riepilogo Architettura UML

#### 🎯 **Punti Chiave del Flusso:**

1. **Frontend React**: SPA con routing, state management locale, hooks personalizzati
2. **Backend Express**: API RESTful, autenticazione Passport, sessioni
3. **Database SQLite**: 5 tabelle relazionali, integrità referenziale
4. **Timer Client-Side**: Gestione timeout con persistenza localStorage
5. **Drag & Drop**: Interfaccia intuitiva con @dnd-kit
6. **Dual Mode**: Partite demo vs complete per guest/authenticated users

#### 🔄 **Flusso Principale:**
**Login/Guest** → **Crea Partita** → **Load Round Card** → **Timer Start** → **User Interaction** → **Submit/Timeout** → **Process Result** → **Continue/End**

---

## 💾 Schema Database

Il sistema utilizza un database SQLite con 5 tabelle principali:

### 👤 Tabella `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    salt TEXT
);
```
**Scopo**: Gestione utenti registrati con autenticazione sicura.

### 🃏 Tabella `cards`
```sql
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    misfortune_index REAL NOT NULL
);
```
**Scopo**: Catalog di tutte le carte con le situazioni sfortunate universitarie.

**Esempi di carte**:
- "File con la tesi corrotto" (misfortune_index: 95.5)
- "Computer rubato" (misfortune_index: 92.5)
- "Dimenticato l'esame" (misfortune_index: 80.5)
- "Caffè rovesciato sugli appunti" (misfortune_index: 65.5)
- "Dormire durante la lezione" (misfortune_index: 30.0)

### 🎮 Tabella `games`
```sql
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                -- NULL per partite guest
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    result TEXT,                    -- 'won' | 'lost'
    incorrect_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```
**Scopo**: Tracciamento delle partite con metadati temporali e risultati.

### 🃏 Tabella `game_cards`
```sql
CREATE TABLE game_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    acquisition_order INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (card_id) REFERENCES cards (id)
);
```
**Scopo**: Relazione many-to-many tra partite e carte con ordine di acquisizione.

### 🎯 Tabella `game_rounds`
```sql
CREATE TABLE game_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    presented_card_id INTEGER NOT NULL,
    chosen_position INTEGER NOT NULL,      -- -1 per timeout
    correct_position INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER,                    -- secondi impiegati
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (presented_card_id) REFERENCES cards (id)
);
```
**Scopo**: Tracciamento dettagliato di ogni tentativo con posizioni e tempi.

---

## 🚀 Meccaniche di Gioco

### 🔄 Flusso di Gioco Principale

1. **Inizializzazione Partita**
   ```javascript
   // Server: creazione con 3 carte iniziali
   const createGameWithCards = async (userId) => {
     const game = await gameDao.createGame(userId);
     const cards = await getUniqueRandomCards(3);
     // Aggiunge carte al gioco con ordine di acquisizione
   };
   ```

2. **Round di Gioco**
   ```javascript
   // Client: caricamento carta round
   const loadRoundCard = async () => {
     const card = await getNextRoundCard(gameId);
     // Carta viene mostrata SENZA misfortune_index
   };
   ```

3. **Posizionamento Carta**
   ```javascript
   // Server: calcolo posizione corretta
   const calculateCorrectPosition = (gameCards, roundCard) => {
     const sortedCards = [...gameCards].sort((a, b) => a.misfortune_index - b.misfortune_index);
     // Trova la posizione corretta basata sull'indice di sfortuna
   };
   ```

### ⚡ Sistema di Timer e Timeout

- **Durata Round**: 30 secondi per ogni posizionamento
- **Gestione Timeout**: Se il tempo scade, viene inviata una posizione speciale (-1)
- **Fallback**: Sistema di recupero per errori di rete durante il timeout

```javascript
// Client: gestione timeout con fallback
const handleTimeUp = async () => {
  try {
    const result = await submitCardPlacement(gameId, roundCard.id, TIMEOUT_POSITION);
    // Aggiorna stato con risultato server
  } catch (error) {
    // Fallback locale per problemi di rete
    const fallbackResult = createFallbackResult(attemptsMade);
  }
};
```

### 🎯 Sistema di Punteggio e Tentativi

- **Tentativi Massimi**: 3 errori per partita completa
- **Guest Mode**: Solo 1 tentativo per round demo
- **Calcolo Risultato**: Basato su posizione corretta vs scelta del giocatore

---

## 🎮 Interfaccia Utente e Componenti

### 🖼️ Componenti Principali

#### `GameRound.jsx` - Interfaccia di Gioco
- **Drag & Drop**: Utilizza @dnd-kit per posizionamento intuitivo
- **Preview**: Mostra anteprima del posizionamento in tempo reale
- **Timer Visivo**: Countdown con warning a 10 secondi
- **Responsive**: Ottimizzato per desktop e mobile

```jsx
// Drag & Drop con anteprima
const handleDragOver = (event) => {
  const { active, over } = event;
  if (active.id === 'new-card') {
    // Mostra anteprima posizionamento
    const newPreview = createPreviewWithNewCard(sortedCards, roundCard, position);
    setPreviewCards(newPreview);
  }
};
```

#### `MisfortuneCard.jsx` - Componente Carta
- **Design**: Carta stilizzata con immagine SVG e indice di sfortuna
- **Stati**: Normale, selezionabile, feedback risultato (✓/✗)
- **Responsive**: Dimensioni adattive per diversi dispositivi

#### `GameOver.jsx` - Schermata Finale
- **Statistiche**: Dettaglio completo della partita
- **Cronologia Round**: Mostra ogni tentativo con carta, posizioni e tempi
- **Navigazione**: Opzioni per nuova partita o ritorno home

### 📱 Design Responsive

Il gioco è completamente responsive con breakpoint per:
- **Desktop**: > 768px - Layout completo con tutte le funzionalità
- **Tablet**: 768px-480px - Layout compatto con scroll orizzontale
- **Mobile**: < 480px - Layout verticale ottimizzato per touch

---

## 🔐 Sistema di Autenticazione

### 👤 Gestione Utenti

Il sistema supporta due modalità:

#### **Utenti Registrati**
- **Login**: Username/password con sessioni persistenti
- **Funzionalità Complete**: Partite complete, cronologia, statistiche
- **Sicurezza**: Password hash con salt, sessioni Express

#### **Modalità Guest/Demo**
- **Accesso Immediato**: Nessuna registrazione richiesta
- **Limitazioni**: 1 solo round, nessun salvataggio cronologia
- **Conversione**: Possibilità di registrarsi per salvare progresso

```javascript
// AuthContext - gestione stato autenticazione
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auto-login al caricamento app
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);
};
```

---

## 🛠️ Gestione Stato e Hooks

### `useGameState.js` - Hook Principale di Gioco

Gestisce tutto lo stato del gioco con persistenza locale:

```javascript
const useGameState = (gameId) => {
  // Stati principali
  const [game, setGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [roundCard, setRoundCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('loading');
  
  // Persistenza localStorage per recovery
  useEffect(() => {
    saveGameStateToLocalStorage(gameId, roundCard, gamePhase, incorrectAttempts);
  }, [gameId, roundCard, gamePhase, incorrectAttempts]);
  
  // Funzioni principali
  return {
    // Stato
    game, cards, rounds, loading, error,
    roundCard, gamePhase, roundResult, incorrectAttempts,
    
    // Azioni
    loadRoundCard,
    handlePlaceCard,
    handleTimeUp,
    onContinue
  };
};
```

### `useGameTimer.js` - Gestione Timer

Hook dedicato per il countdown di round:

```javascript
const useGameTimer = () => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  
  return {
    timeLeft,
    startTimer: () => setIsRunning(true),
    stopTimer: () => setIsRunning(false),
    resetTimer: () => setTimeLeft(30)
  };
};
```

---

## 🌐 API Routes e Endpoint

### 🔒 Autenticazione
- `POST /api/sessions` - Login utente
- `GET /api/sessions/current` - Verifica sessione attiva
- `DELETE /api/sessions/current` - Logout

### 🎮 Gestione Partite
- `POST /api/games` - Crea nuova partita
- `GET /api/games` - Lista partite utente (protetta)
- `GET /api/games/:id` - Dettagli partita specifica
- `GET /api/games/:id/round` - Carta per nuovo round
- `POST /api/games/:id/round` - Submissione posizionamento
- `POST /api/games/:id/end` - Terminazione manuale partita

### 📊 Formato Dati API

**Creazione Partita**:
```json
{
  "game": {
    "id": 123,
    "user_id": 1,
    "start_date": "2025-06-23T10:30:00.000Z",
    "result": null,
    "incorrect_attempts": 0
  },
  "cards": [
    {
      "id": 45,
      "name": "Dormire durante la lezione",
      "image_url": "/images/cards/sleep_during_class.svg",
      "misfortune_index": 30.0,
      "acquisition_order": 1
    }
  ]
}
```

**Submissione Round**:
```json
{
  "cardId": 67,
  "position": 2,
  "timeTaken": 15
}
```

**Risposta Round**:
```json
{
  "result": "correct",
  "card": {
    "id": 67,
    "name": "Caffè rovesciato sugli appunti",
    "misfortune_index": 65.5
  },
  "correctPosition": 2,
  "gameCompleted": false,
  "incorrectAttempts": 0
}
```

---

## 📝 Gestione Errori e Resilienza

### 🛡️ Strategie di Error Handling

#### **Frontend**
- **Network Errors**: Retry automatico con backoff
- **State Recovery**: Ripristino da localStorage in caso di reload
- **Fallback UI**: Messaggi informativi per l'utente

```javascript
// Esempio: gestione errore con fallback
const handlePlaceCard = async (cardId, position) => {
  try {
    const result = await submitCardPlacement(gameId, cardId, position);
    return result;
  } catch (error) {
    console.error('Errore placement:', error);
    // Fallback: aggiorna stato locale
    const fallbackResult = createFallbackResult(attempts);
    setRoundResult(fallbackResult);
  }
};
```

#### **Backend**
- **Database Transactions**: Operazioni atomiche per consistenza
- **Input Validation**: Sanitizzazione e validazione dati
- **Error Logging**: Logging dettagliato per debugging

### 🔄 Sistema di Backup e Recovery

- **localStorage**: Salvataggio stato gioco per recovery post-refresh
- **Database**: Backup automatico delle partite completate
- **Cleanup**: Rimozione automatica stati obsoleti

---

## 🚀 Deployment e Performance

### ⚡ Ottimizzazioni Performance

#### **Frontend**
- **Code Splitting**: Caricamento lazy delle pagine
- **Image Optimization**: SVG ottimizzate per carte
- **Bundle Analysis**: Monitoring dimensioni bundle

#### **Backend**
- **Database Indexing**: Indici su foreign keys
- **Query Optimization**: Query efficienti con prepared statements
- **Session Management**: Configurazione ottimale sessioni Express

---

## 🛠️ Development Workflow

### 📋 Comandi Principali

```bash
# Setup iniziale
npm install             # Install dipendenze client
cd server && npm install # Install dipendenze server

# Sviluppo
npm run dev             # Client su porta 5173
cd server && node index.mjs  # Server su porta 3001
```

### 🔄 Database Management

```bash
# Reset database con dati sample
node index.mjs --reset

```

### 📁 File di Configurazione

- `vite.config.js`: Configurazione build frontend
- `eslint.config.js`: Linting rules
- `package.json`: Dipendenze e scripts

### 📚 Tecnologie e Framework

Un ringraziamento speciale alle comunità open source di:
- React.js e l'ecosistema React
- Express.js e Node.js
- SQLite per la semplicità di deployment
- @dnd-kit per le interazioni drag & drop
- Bootstrap per i componenti UI

---

*Documentazione aggiornata al: 26 Giugno 2025*
