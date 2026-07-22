# Book Management App — Documentation

## 1. What This Project Is

A **CRUD (Create, Read, Update, Delete) Book Management application** built with:

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Web framework | Express.js |
| Database | MongoDB |
| ODM (Object Document Mapper) | Mongoose |
| Views / Templating | EJS |
| Validation | express-validator |

It lets a user manage a list of books (title, author, price, publisher) through a **web UI** (HTML forms/tables rendered with EJS) **and** a **JSON REST API**, using the exact same routes and controllers. The server decides which one to send back based on the request's `Accept` header / content type — a technique called **content negotiation**.

---

## 2. Why It's Built This Way (Architecture)

The project follows the classic **MVC-ish layered pattern** used in most Express apps:

```
Request → Route → Middleware (validation) → Controller → Model (Mongoose) → MongoDB
                                                  ↓
                                       Response: JSON  or  Rendered EJS page
```

This separation exists so that:
- **Routes** (`bookRoutes.js`) only define *which URL maps to which function* — no logic.
- **Controllers** (`bookControllers.js`) hold the actual business logic (talking to the database, deciding what to respond with).
- **Models** (`BookModel.js`) define the *shape* of a Book document and let Mongoose validate/query MongoDB.
- **Middleware** (`validator.js`) checks incoming data *before* it ever reaches the controller, so controllers can assume the data is already valid.
- **Views** (`.ejs` files) are just templates for HTML — they contain no business logic, only display logic (loops, conditionals for rendering).

This makes each file replaceable/testable independently — e.g., you could swap EJS for React without touching controllers, or swap MongoDB for PostgreSQL without touching routes/views.

---

## 3. How It Works — File by File

### `server.js` — Application entry point
- Creates the Express app and sets EJS as the **view engine**.
- Loads environment variables from `.env` via `dotenv`.
- Calls `connectDB()` to connect to MongoDB before anything else.
- Sets a custom DNS (`8.8.8.8`/`8.8.4.4`) — usually done to fix DNS resolution issues connecting to MongoDB Atlas on some networks/ISPs.
- Registers body parsers: `urlencoded` (for HTML form submissions) and `express.json()` (for JSON API requests).
- **Method override middleware**: HTML forms can only send `GET`/`POST`, not `PUT`/`DELETE`. This custom middleware looks for a hidden `_method` field in the form body (see `edit.ejs`/`index.ejs`) and rewrites `req.method` to `PUT` or `DELETE` accordingly — this is *why* the edit/delete forms work even though `<form>` doesn't support those verbs.
- Serves static files from `/public` (CSS, JS, images — not included in what you uploaded).
- Redirects `/` → `/books`.
- Mounts all book routes under the `/books` prefix.
- Catches unmatched routes → renders `404.ejs`.
- A final **error-handling middleware** catches any thrown/uncaught errors and returns a generic 500.

### `src/config/db.js` — Database connection
- Uses `mongoose.connect()` with the `MONGODB_URL` from `.env`.
- On failure, logs the error and calls `process.exit(1)` — the app deliberately **won't run** without a working DB connection, which prevents confusing downstream errors.

### `src/models/BookModel.js` — Data schema
Defines what a "Book" document looks like in MongoDB:
| Field | Type | Required |
|---|---|---|
| title | String | ✅ |
| price | Number | ✅ |
| author | String | ✅ |
| publisher | String | ❌ |

`{ timestamps: true }` auto-adds `createdAt`/`updatedAt` fields to every document.

### `src/middleware/validator.js` — Input validation
- `bookValidation`: an array of rules (title non-empty, price ≥ 0 and numeric, author non-empty) using `express-validator`.
- `validation`: runs *after* `bookValidation`, checks if any rule failed. If so, responds with either a plain error string (for HTML form submits) or a JSON error object (for API clients) — again using content negotiation based on the `Accept` header.
- This runs **before** the controller, so `createBook`/`updateBook` never receive bad data.

### `src/controllers/bookControllers.js` — Business logic
This is the core of the app. Each exported function handles one action:

| Function | Purpose |
|---|---|
| `getAddForm` | Renders the "Add Book" HTML form (`add.ejs`) |
| `getEditForm` | Fetches one book by ID, renders `edit.ejs` pre-filled, or 404 if not found |
| `createBook` | Inserts a new book into MongoDB; redirects to `/books` for HTML, returns JSON for API |
| `getBooks` | Lists all books, with optional `?search=` (title regex, case-insensitive) and `?sort=` (e.g. `price` or `-price`) query params; renders `index.ejs` or returns JSON |
| `getBook` | Fetches a single book by ID; renders `view.ejs` or returns JSON, 404 if missing |
| `updateBook` | Updates a book by URL param `:id` (used by the edit form via method-override PUT) |
| `updateBookQuery` | Same as above but takes `id` from a query string (`PUT /books/update?id=...`) — an alternate API-style route |
| `deleteBook` | Deletes a book by URL param `:id` |
| `deleteBookByQuery` | Deletes a book by query string `id` — alternate API-style route |

**Why the "Accept header" branching everywhere?** So the *same* controller can serve a browser (which wants a rendered HTML page) and a REST API client (which wants JSON), without duplicating logic in two places.

### `src/Routes/bookRoutes.js` — URL map
All routes are mounted under `/books` (set in `server.js`):

| Method | Path | Controller | Purpose |
|---|---|---|---|
| GET | `/books/add` | `getAddForm` | Show add-book form |
| GET | `/books/:id/edit` | `getEditForm` | Show edit-book form |
| PUT | `/books/update?id=` | `updateBookQuery` | Update book (query-param style, API use) |
| DELETE | `/books/delete?id=` | `deleteBookByQuery` | Delete book (query-param style, API use) |
| POST | `/books/` | `createBook` | Create a new book |
| GET | `/books/` | `getBooks` | List/search/sort books |
| GET | `/books/:id` | `getBook` | View one book |
| PUT | `/books/:id` | `updateBook` | Update one book |
| DELETE | `/books/:id` | `deleteBook` | Delete one book |

⚠️ **Route ordering matters in Express.** `/books/add` and `/books/:id/edit` must be declared *before* `/books/:id`, otherwise Express would treat `"add"` as an `:id` value. This file has them in the correct order.

### Views (`.ejs` files) — What the user sees
- `header.ejs` / `footer.ejs` / `navbar.ejs`: shared partials included at the top/bottom of every page (HTML boilerplate, `<head>`, nav bar, closing tags). *(Uploaded empty in this case — but every page includes them via `<%- include(...) %>`.)*
- `add.ejs`: form to create a book — plain `POST /books`.
- `edit.ejs`: form to update a book — `POST` with a hidden `_method=PUT` field, so `server.js`'s method-override middleware turns it into a real `PUT /books/:id`.
- `index.ejs`: main book list page — includes a search box and a sort dropdown (both submit as `GET /books?search=...&sort=...`), a table of books, and per-row **View / Edit / Delete** actions (delete also uses the `_method=DELETE` trick).
- `view.ejs`: single book detail page.
- `404.ejs`: shown whenever a route or record isn't found.

---

## 4. How to Run It

1. **Install dependencies** (assuming a `package.json` with express, mongoose, ejs, dotenv, express-validator):
   ```bash
   npm install
   ```
2. **Set up environment variables** — create a `.env` file (not `_env`) in the project root:
   ```
   PORT=8001
   MONGODB_URL="your-mongodb-connection-string"
   ```
3. **Start the server**:
   ```bash
   node server.js
   ```
4. Visit `http://localhost:8001` → redirects to `/books`.

---

## 5. Using It

### As a website (browser)
- Go to `/books` to see the list, search, and sort.
- Click **Add Book**-equivalent link/route (`/books/add`) to create one.
- Click **View**, **Edit**, or **Delete** per row.

### As a JSON API (Postman, curl, frontend app, etc.)
Send requests with `Accept: application/json` (or just don't send an HTML browser's default headers):

```bash
# List books
GET /books

# Search + sort
GET /books?search=harry&sort=-price

# Get one book
GET /books/<id>

# Create a book
POST /books
Content-Type: application/json
{ "title": "Dune", "author": "Frank Herbert", "price": 15 }

# Update a book
PUT /books/<id>
{ "price": 20 }

# Delete a book
DELETE /books/<id>
```

---

## 6. Notable Issues Found in the Code

These are worth fixing but don't stop the app from running:

1. **Exposed database credentials**: the uploaded `_env` file contains a live MongoDB Atlas username/password. Treat this as leaked — rotate the password in Atlas and never commit `.env` files (add `.env` to `.gitignore`).
2. **Typo bug** in `getBooks` (`bookControllers.js`): checks for `"application/x-www-from-urlencoded"` instead of `"application/x-www-form-urlencoded"`. This means that specific fallback branch never triggers as intended (it still works in practice because the `Accept: text/html` check usually catches it first).
3. **Empty partials**: `header.ejs`, `footer.ejs`, `navbar.ejs` were uploaded empty, so as given, pages would render with no `<head>`, styles, or navigation — just the page body content.
4. **No authentication/authorization**: any visitor can create, edit, or delete any book — fine for a learning project, but not production-ready as-is.
5. **`updateBookQuery`/`deleteBookByQuery`** don't check content-type/redirect for HTML like their `:id`-based counterparts — they always return JSON, which is inconsistent but intentional-looking as "API-only" routes.

---

## 7. Summary

This is a small, well-structured **dual-purpose (web + API) Express/MongoDB CRUD app**. Its main design idea is **content negotiation**: one set of routes/controllers serves both browser users (HTML via EJS) and API consumers (JSON), driven by the `Accept` header and method-override for HTML forms that need PUT/DELETE. The layered structure (routes → middleware → controllers → models) keeps each concern isolated and easy to maintain or extend.
