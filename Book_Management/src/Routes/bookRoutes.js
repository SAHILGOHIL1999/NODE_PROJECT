import express from 'express';
import { createBook, getBooks, getBook, updateBook, deleteBook,updateBookQuery, deleteBookByQuery, getAddForm, getEditForm } from "../controllers/bookControllers.js";
import { bookValidation, validation } from "../middleware/validator.js";

const router = express.Router();

router.get('/add', getAddForm);

router.get('/:id/edit', getEditForm);

router.put('/update', bookValidation, validation, updateBookQuery);

router.delete('/delete', deleteBookByQuery);

router.post("/", bookValidation, validation, createBook);

router.get('/', getBooks);

router.get('/:id', getBook);

router.put('/:id', bookValidation, validation, updateBook);

router.delete('/:id', deleteBook);

export default router;