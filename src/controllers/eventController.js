import Event from '../models/Event.js';

export const listPublishedEvents = async (req, res) => {
  const events = await Event.find({ estadoPublicacion: 'PUBLISHED' })
    .sort({ fecha: 1, hora: 1 })
    .lean();
  res.json(events);
};

export const listEventsByRole = async (req, res) => {
  const filter = req.user?.rol === 'ADMIN' ? {} : { estadoPublicacion: 'PUBLISHED' };
  const events = await Event.find(filter).sort({ fecha: 1, hora: 1 }).lean();
  res.json(events);
};

export const getEventByRole = async (req, res) => {
  const ev = await Event.findById(req.params.id);
  if (!ev) return res.status(404).json({ message: 'No encontrado' });
  if (req.user?.rol !== 'ADMIN' && ev.estadoPublicacion !== 'PUBLISHED') {
    return res.status(403).json({ message: 'Prohibido' });
  }
  res.json(ev);
};

export const createEvent = async (req, res) => {
  const ev = await Event.create(req.body);
  res.status(201).json(ev);
};

export const updateEvent = async (req, res) => {
  const ev = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ev) return res.status(404).json({ message: 'No encontrado' });
  res.json(ev);
};
