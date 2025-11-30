import Review from "../models/Review.js";

import { getPaginationParams, buildSearchFilter } from '../utils/pagination.js';

// LIST - Listar todas las reseñas con paginación y búsqueda
export const listReviews = async (req, res) => {
  try {
    const { page, limit, skip, sort, sortDir, q: queryText } = getPaginationParams(req.query);

    const filter = buildSearchFilter(queryText, ['comment']);

    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'nombre apellido email')
        .sort({ [sort]: sortDir, _id: sort === "createdAt" ? sortDir : 1 })
        .skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reseñas", errorMsg: error?.message || error });
  }
};

// CREATE - Alta de una reseña
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!rating || !comment) {
      return res.status(400).json({ error: "Faltan Datos" });
    }

    // Validar rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "El rating debe estar entre 1 y 5" });
    }

    // Validar longitud del comentario
    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({ error: "El comentario debe tener entre 10 y 500 caracteres" });
    }

    // Verificar si el usuario ya hizo una reseña
    const existingReview = await Review.findOne({ user: userId });
    if (existingReview) {
      return res.status(409).json({ error: "Ya has creado una reseña" });
    }

    const newReview = await Review.create({
      user: userId,
      rating,
      comment: comment.trim()
    });

    await newReview.populate('user', 'nombre apellido email');
    res.status(201).json(newReview);

  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Ya tienes una reseña creada", fields: e.keyValue });
    res.status(500).json({ error: "Error al crear reseña", errorMsg: e?.message || e });
  }
};

// READ - Obtener todas las reseñas (sin paginación)
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'nombre apellido email')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reseñas", errorMsg: error?.message || error });
  }
};

// READ - Obtener reseña por ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('user', 'nombre apellido email');

    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    res.json(review);

  } catch (error) {
    console.error('Error al obtener reseña:', error);
    res.status(500).json({ error: "Error al obtener reseña", errorMsg: error?.message || error });
  }
};

// READ - Obtener la reseña del usuario autenticado
export const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user.id })
      .populate('user', 'nombre apellido email')
      .lean();

    if (!review) {
      return res.status(404).json({ message: "No tienes una reseña creada" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tu reseña", errorMsg: error?.message || error });
  }
};

// UPDATE - Modificar la reseña del usuario autenticado
export const updateMyReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Validaciones básicas
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
    }

    // Validar longitud del comentario
    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({ message: 'El comentario debe tener entre 10 y 500 caracteres' });
    }

    const updatedReview = await Review.findOneAndUpdate(
      { user: userId },
      {
        rating,
        comment: comment.trim()
      },
      { new: true, runValidators: true }
    ).populate('user', 'nombre apellido email');

    if (!updatedReview) {
      return res.status(404).json({ message: 'No tienes una reseña para modificar' });
    }

    res.json({
      message: 'Reseña actualizada correctamente',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({ message: 'Error al actualizar la reseña' });
  }
};

// UPDATE - Admin puede actualizar cualquier reseña por ID
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validaciones básicas
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Validar rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
    }

    // Validar longitud del comentario
    if (comment.length < 10 || comment.length > 500) {
      return res.status(400).json({ message: 'El comentario debe tener entre 10 y 500 caracteres' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      {
        rating,
        comment: comment.trim()
      },
      { new: true, runValidators: true }
    ).populate('user', 'nombre apellido email');

    if (!updatedReview) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    res.json({
      message: 'Reseña actualizada correctamente',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    res.status(500).json({ message: 'Error al actualizar la reseña' });
  }
};

// DELETE - Baja de la reseña del usuario autenticado
export const deleteMyReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ user: userId });

    if (!review) {
      return res.status(404).json({ message: 'No tienes una reseña para eliminar' });
    }

    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ error: "Error al eliminar reseña", errorMsg: error?.message || error });
  }
};

// DELETE - Admin puede eliminar cualquier reseña por ID
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ error: "Error al eliminar reseña", errorMsg: error?.message || error });
  }
};