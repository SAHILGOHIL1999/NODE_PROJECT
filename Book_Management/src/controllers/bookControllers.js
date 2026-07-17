import Books from "../models/BookModel.js";

// Show add book form
export const getAddForm = (req, res) => {
  res.render("add");
};

// Show edit book form
export const getEditForm = async (req, res) => {
  try {
    const book = await Books.findById(req.params.id);
    if (!book) {
      return res.status(404).render("404");
    }
    res.render("edit", { book });
  } catch (error) {
    res.status(500).render("404");
  }
};

// Create book
export const createBook = async (req, res) => {
  try {
    const book = await Books.create(req.body);
    const accept = req.headers.accept || "";
    if (accept.includes("text/html") || req.is("application/x-www-form-urlencoded")) {
      return res.redirect("/books");
    }

    res.status(201).json({
      success: true,
      message: "Book Created Successfully.",
      data: book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Books (with search/sort)
export const getBooks = async (req, res) => {
  try {
    const { search, sort } = req.query;
    let filter = {};

    if (search) {
      filter.title = { // Fixed query property to match schema
        $regex: search,
        $options: "i",
      };
    }

    let query = Books.find(filter);

    if (sort) {
      // Expecting standard mongoose sort formats like 'price' or '-price'
      query = query.sort(sort);
    }

    const books = await query;
    const accept = req.headers.accept || "";

    if (accept.includes("text/html") || req.is("application/x-www-from-urlencoded")) {
      return res.render("index", { books, search: search || "" });
    }

    res.status(200).json({
      success: true,
      total: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Book
export const getBook = async (req, res) => {
  try {
    const book = await Books.findById(req.params.id);
    const accept = req.headers.accept || "";

    if (!book) {
      if (accept.includes("text/html")) {
        return res.status(404).render("404");
      }
      return res.status(404).json({ message: "Book Not Found" });
    }

    if (accept.includes("text/html")) {
      return res.render("view", { book });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Book (Param URL)
export const updateBook = async (req, res) => {
  try {
    const book = await Books.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    const accept = req.headers.accept || "";
    if (accept.includes("text/html") || req.is("application/x-www-form-urlencoded")) {
      return res.redirect("/books");
    }

    res.json({
      success: true,
      message: "Book Updated",
      data: book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Book (Query Param)
export const updateBookQuery = async (req, res) => {
  try {
    const { id } = req.query;
    const book = await Books.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    res.json({
      success: true,
      message: "Book Updated",
      data: book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Book (Param URL)
export const deleteBook = async (req, res) => {
  try {
    const book = await Books.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    const accept = req.headers.accept || "";
    if (accept.includes("text/html") || req.is("application/x-www-form-urlencoded")) {
      return res.redirect("/books");
    }

    res.json({
      success: true,
      message: "Book Deleted Successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Book (Query Param)
export const deleteBookByQuery = async (req, res) => {
  try {
    const { id } = req.query;
    const book = await Books.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    res.json({
      success: true,
      message: "Book Deleted Successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};