import { body, validationResult } from "express-validator";

export const bookValidation = [
  body("title").trim().notEmpty().withMessage("Book title is required"),

  body("price")
    .isFloat({ min: 0 })
    .withMessage("Valid price is required and must be 0 or greater"),

  body("author").trim().notEmpty().withMessage("Author name is required"),
];

export const validation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const accept = req.headers.accept || "";
    if (accept.includes("text/html") || req.is("application/x-www-form-urlencoded")) {
       return res.status(400).send(errors.array().map(e => e.msg).join(", "));
    }
    
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};