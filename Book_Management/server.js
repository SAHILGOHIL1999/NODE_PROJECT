import express, { urlencoded } from 'express';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';
import BookRouter from './src/Routes/bookRoutes.js';

dotenv.config({ path: './.env' });
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
app.set('view engine', 'ejs');

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));

app.use(urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        req.method = req.body._method;
        delete req.body._method;
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect("/books");
});

app.use('/books', BookRouter);

app.use((req, res) => {
    res.status(404).render("404");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something Went Wrong");
});

const port = process.env.PORT

app.listen(port, () => {
    console.log(`Server running successfully at http://localhost:${port}`);
});