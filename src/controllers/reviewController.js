import Review from "../models/Review.js";

import { getPaginationParams, buildSearchFilter } from '../utils/pagination.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// LIST - Listar todas las reseñas con paginación y búsqueda
export const listReviews = asyncHandler(async (req, res) => {
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
});

// CREATE - Alta de una reseña
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user?.id;

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
});

// READ - Obtener todas las reseñas (sin paginación)
export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'nombre apellido email')
    .sort({ createdAt: -1 })
    .lean();

  res.json(reviews);
});

// READ - Obtener reseña por ID
export const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate('user', 'nombre apellido email');

  if (!review) {
    return res.status(404).json({ message: 'Reseña no encontrada' });
  }

  res.json(review);
});

// READ - Obtener la reseña del usuario autenticado
export const getMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ user: req.user.id })
    .populate('user', 'nombre apellido email')
    .lean();

  if (!review) {
    return res.status(404).json({ message: "No tienes una reseña creada" });
  }

  res.json(review);
});

// UPDATE - Modificar la reseña del usuario autenticado
export const updateMyReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { rating, comment } = req.body;

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
});

// UPDATE - Admin puede actualizar cualquier reseña por ID
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

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
});

// DELETE - Baja de la reseña del usuario autenticado
export const deleteMyReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const review = await Review.findOneAndDelete({ user: userId });

  if (!review) {
    return res.status(404).json({ message: 'No tienes una reseña para eliminar' });
  }

  res.json({ message: 'Reseña eliminada correctamente' });
});

// DELETE - Admin puede eliminar cualquier reseña por ID
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByIdAndDelete(id);

  if (!review) {
    return res.status(404).json({ message: 'Reseña no encontrada' });
  }

  res.json({ message: 'Reseña eliminada correctamente' });
});