import { Request, Response } from 'express';

import { ImportantSpotRepository } from '../repositories/importantSpotRepository';
// import { SpotType } from '@prisma/client';
import { baseResponse, errorResponse } from '../utils/baseResponse';

const repo = new ImportantSpotRepository();

export async function createSpot(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { name, latitude, longitude, type, customType } = req.body;
    if (!eventId || !name || latitude == null || longitude == null || !type) {
      return res.status(400).json(baseResponse({ success: false, message: 'Missing required fields' }));
    }
    const spot = await repo.createSpot({ eventId, name, latitude, longitude, type, customType });
    return res.status(201).json(baseResponse({ success: true, message: 'Spot created', data: spot }));
  } catch (err) {
    return res.status(500).json(errorResponse(err));
  }
}

export async function getSpotsByEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    if (!eventId) return res.status(400).json(baseResponse({ success: false, message: 'Missing eventId' }));
    const spots = await repo.getSpotsByEvent(eventId);
    return res.json(baseResponse({ success: true, data: spots }));
  } catch (err) {
    return res.status(500).json(errorResponse(err));
  }
}

export async function getSpotById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(baseResponse({ success: false, message: 'Missing spot id' }));
    const spot = await repo.getSpotById(id);
    if (!spot) return res.status(404).json(baseResponse({ success: false, message: 'Spot not found' }));
    return res.json(baseResponse({ success: true, data: spot }));
  } catch (err) {
    return res.status(500).json(errorResponse(err));
  }
}

export async function updateSpot(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!id) return res.status(400).json(baseResponse({ success: false, message: 'Missing spot id' }));
    const spot = await repo.updateSpot(id, data);
    return res.json(baseResponse({ success: true, message: 'Spot updated', data: spot }));
  } catch (err) {
    return res.status(500).json(errorResponse(err));
  }
}

export async function deleteSpot(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(baseResponse({ success: false, message: 'Missing spot id' }));
    const spot = await repo.deleteSpot(id);
    return res.json(baseResponse({ success: true, message: 'Spot deleted', data: spot }));
  } catch (err) {
    return res.status(500).json(errorResponse(err));
  }
}
