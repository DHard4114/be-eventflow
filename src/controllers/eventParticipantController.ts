/**
 * File: eventParticipantController.ts
 * Author: eventFlow Team
 * Deskripsi: Controller khusus untuk operasi CRUD dan query EventParticipant
 * Dibuat: 2025-11-22
 * Versi: 1.0.0
 * Lisensi: MIT
 */
import { Request, Response } from 'express';
import {
  findActiveEventParticipant,
  listEventParticipants,
  joinOrReactivateEventParticipant,
  unjoinEventParticipant,
  deleteEventParticipant,
  countEventParticipants,
  listEventParticipantHistory
} from '../repositories/eventParticipantRepository';


import { updateEvent } from '../repositories/eventRepository';
import { baseResponse, errorResponse } from '../utils/baseResponse';

// Get active participant by userId & eventId
export const getEventParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.params;
    const participant = await findActiveEventParticipant(userId, eventId);
    if (!participant) return res.status(404).json(errorResponse('Participant not found'));
    res.json(baseResponse({ success: true, data: participant }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const listParticipants = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const participants = await listEventParticipants(eventId);
    res.json(baseResponse({ success: true, data: participants }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

/**
 * Get history partisipasi user pada event
 */
export const getEventParticipantHistory = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (require('../utils/jwt').verifyJwt(token)) : null;
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { eventId, userId } = req.params;
    if (!eventId || !userId) {
      return res.status(400).json({ success: false, message: 'eventId dan userId wajib diisi' });
    }
    const history = await listEventParticipantHistory(userId, eventId);
    return res.json({ success: true, data: history, message: 'History partisipasi user pada event' });
  } catch (err) {
    console.error('Get participant history error:', err);
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json(errorResponse('userId dan eventId wajib diisi'));
    }
    const participant = await joinOrReactivateEventParticipant(userId, eventId);
    res.json(baseResponse({ success: true, data: participant }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Unjoin participant (set isActive = false)
export const unjoinParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.params;
    const participant = await unjoinEventParticipant(userId, eventId);
    if (!participant) return res.status(404).json(errorResponse('Active participant not found'));
    // Update totalParticipants di Event setelah unjoin
   
    const totalParticipants = await countEventParticipants(eventId);
    await updateEvent(eventId, { totalParticipants });
    res.json(baseResponse({ success: true, data: { participant, totalParticipants } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Hapus record by id
export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await deleteEventParticipant(id);
    res.json(baseResponse({ success: true, data: participant }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

export const countParticipants = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const count = await countEventParticipants(eventId);
    res.json(baseResponse({ success: true, data: { count } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};
