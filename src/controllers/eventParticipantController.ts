/**
 * @file eventParticipantController.ts
 * @module controllers/eventParticipantController
 * @author eventFlow Team
 * @description Controller for CRUD operations and queries related to EventParticipant.
 * @created 2025-11-22
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Express, Prisma, ../repositories/eventParticipantRepository, ../repositories/eventRepository, ../config/prisma, ../utils/baseResponse
 */
import { Request, Response } from 'express';
import {
  findActiveEventParticipant,
  listEventParticipants,
  joinOrReactivateEventParticipant,
  unjoinEventParticipant,
  deleteEventParticipant,
  countEventParticipants,
  listEventParticipantHistory,
  getAttendanceStats,
  updateAttendanceStatus,
  markPendingAsAbsent
} from '../repositories/eventParticipantRepository';


import { updateEvent } from '../repositories/eventRepository';
import { prisma } from '../config/prisma';
import { baseResponse, errorResponse } from '../utils/baseResponse';

// Retrieve active participant by userId and eventId
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
    const participants = await listEventParticipants(eventId, true); // Exclude organizer from the list
    res.json(baseResponse({ success: true, data: participants }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

/**
 * Retrieve the participation history of a user in an event.
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
      return res.status(400).json({ success: false, message: 'eventId and userId are required' });
    }
    const history = await listEventParticipantHistory(userId, eventId);
    return res.json({ success: true, data: history, message: 'User participation history for the event' });
  } catch (err) {
    console.error('Get participant history error:', err);
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json(errorResponse('userId and eventId are required'));
    }
    const participant = await joinOrReactivateEventParticipant(userId, eventId);
    res.json(baseResponse({ success: true, data: participant }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Unjoin participant (set isActive to false)
export const unjoinParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.params;
    const participant = await unjoinEventParticipant(userId, eventId);
    if (!participant) return res.status(404).json(errorResponse('Active participant not found'));
    // Update totalParticipants in Event after unjoining
    const totalParticipants = await countEventParticipants(eventId);
    await updateEvent(eventId, { totalParticipants });
    res.json(baseResponse({ success: true, data: { participant, totalParticipants } }));
  } catch (err) {
    res.status(500).json(errorResponse(err));
  }
};

// Delete participant record by id
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

// Retrieve attendance statistics for organizer
export const getAttendanceStatistics = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json(errorResponse('eventId is required'));
    }
    
    const stats = await getAttendanceStats(eventId);
    res.json(baseResponse({ 
      success: true, 
      data: stats,
      message: 'Attendance statistics retrieved successfully'
    }));
  } catch (err) {
    console.error('Get attendance stats error:', err);
    res.status(500).json(errorResponse(err));
  }
};

// Manually update attendance status (organizer override)
export const updateParticipantAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const { attendanceStatus } = req.body;
    
    if (!['PENDING', 'PRESENT', 'ABSENT'].includes(attendanceStatus)) {
      return res.status(400).json(errorResponse('Invalid attendance status'));
    }
    
    const participant = await updateAttendanceStatus(
      userId, 
      eventId, 
      attendanceStatus,
      attendanceStatus === 'PRESENT' ? new Date() : undefined
    );
    
    if (!participant) {
      return res.status(404).json(errorResponse('Participant not found'));
    }
    
    res.json(baseResponse({ 
      success: true, 
      data: participant,
      message: 'Attendance status updated successfully'
    }));
  } catch (err) {
    console.error('Update attendance error:', err);
    res.status(500).json(errorResponse(err));
  }
};

// Process ended events - mark all PENDING participants as ABSENT
export const processEndedEvents = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Find events that have just ended (endTime has passed) or have been cancelled
    const recentlyEndedEvents = await prisma.event.findMany({
      where: {
        OR: [
          {
            // Events that have just ended
            endTime: {
              gte: oneHourAgo,
              lte: now,
            },
            status: {
              in: ['ONGOING', 'UPCOMING'],
            },
          },
          {
            // Events that have just been cancelled
            status: 'CANCELLED',
            updatedAt: {
              gte: oneHourAgo,
              lte: now,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
    
    if (recentlyEndedEvents.length === 0) {
      return res.json(baseResponse({ 
        success: true, 
        data: { 
          message: 'No recently ended or cancelled events found',
          processedEvents: []
        }
      }));
    }
    
    const processedEvents = [];
    
    for (const event of recentlyEndedEvents) {
      const markedCount = await markPendingAsAbsent(event.id);
      
      // Update event status if not already COMPLETED or CANCELLED
      if (event.status !== 'CANCELLED') {
        await prisma.event.update({
          where: { id: event.id },
          data: { status: 'COMPLETED' },
        });
      }
      
      processedEvents.push({
        eventId: event.id,
        eventName: event.name,
        markedAbsent: markedCount,
        eventStatus: event.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
      });
    }
    
    res.json(baseResponse({ 
      success: true, 
      data: { 
        message: `Processed ${processedEvents.length} event(s)`,
        processedEvents
      }
    }));
  } catch (err) {
    console.error('[Process Ended Events] Error:', err);
    res.status(500).json(errorResponse(err));
  }
};
