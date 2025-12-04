/**
 * File: pollController.ts
 * Author: eventFlow Team
 * Deskripsi: Mengelola endpoint voting/polling event dengan real-time Socket.io dan optimized counting.
 * Dibuat: 2025-11-11
 * Versi: 2.0.1
 * Lisensi: MIT
 * Dependensi: Express, Prisma, JWT, Socket.io
*/
import { Request, Response } from 'express';
import { baseResponse } from '../utils/baseResponse';
import { errorResponse } from '../utils/baseResponse';
import { JWTPayload } from '../types/jwtPayload';
import { verifyJwt } from '../utils/jwt';
import {
  emitVotingUpdate,
  emitPollCreated,
  emitPollDeleted
} from '../utils/socket';
import {
  submitPollVote,
  deletePollVote,
  deletePoll,
  createPoll,
  getEventPolls,
  getPollWithVoteStats,
  getUserVoteInPoll
} from '../repositories/pollRepository';

export const createPollController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    
    const { eventId } = req.params;
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2)
      return res.status(400).json(errorResponse('Pertanyaan dan minimal 2 opsi diperlukan'));

    const poll = await createPoll({ eventId, question, options });
    const pollWithStats = await getPollWithVoteStats(poll.id);
    if (!pollWithStats) {
      return res.status(404).json(errorResponse('Poll tidak ditemukan setelah pembuatan'));
    }
    emitPollCreated(eventId, {
      pollId: pollWithStats.id,
      question: pollWithStats.question,
      options: pollWithStats.options,
      eventId,
      createdAt: pollWithStats.createdAt
    });
    res.json(baseResponse({ 
      success: true, 
      data: pollWithStats,
      message: 'Poll berhasil dibuat'
    }));
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

// Submit vote pada polling event
export const submitVote = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    
    const { eventId, pollId } = req.params;
    const { pollOptionId } = req.body;
    if (!pollOptionId)
      return res.status(400).json(errorResponse('Opsi voting kosong'));

    const { vote, updatedOptions } = await submitPollVote({
      pollOptionId,
      userId: payload.userId,
    });
    const pollStats = await getPollWithVoteStats(pollId);
    emitVotingUpdate(eventId, {
      pollId,
      options: updatedOptions,
      totalVotes: pollStats?.totalVotes || 0,
      userVoted: pollOptionId,
      userId: payload.userId
    });
    res.json(baseResponse({
      success: true,
      data: {
        vote,
        options: updatedOptions,
        totalVotes: pollStats?.totalVotes || 0
      },
      message: 'Vote berhasil disimpan'
    }));
  } catch (err) {
    console.error('Submit vote error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

// Ambil hasil polling event dengan statistik lengkap
export const getPollResults = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    const userId = payload?.userId;
    const pollStats = await getPollWithVoteStats(pollId, userId);
    if (!pollStats) {
      return res.status(404).json(errorResponse('Poll tidak ditemukan'));
    }
    res.json(baseResponse({ 
      success: true, 
      data: pollStats 
    }));
  } catch (err) {
    console.error('Get poll results error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

// Un-vote (hapus vote polling event)
export const unPollVote = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    
    const { eventId, pollId } = req.params;
    const { deletedCount, updatedOptions } = await deletePollVote(pollId, payload.userId);
    const pollStats = await getPollWithVoteStats(pollId);
    emitVotingUpdate(eventId, {
      pollId,
      options: updatedOptions,
      totalVotes: pollStats?.totalVotes || 0,
      userVoted: null,
      userId: payload.userId
    });
    res.json(baseResponse({ 
      success: true, 
      data: { 
        deletedCount, 
        options: updatedOptions,
        totalVotes: pollStats?.totalVotes || 0
      },
      message: 'Vote berhasil dihapus'
    }));
  } catch (err) {
    console.error('Unvote error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

// Get user's current vote in a poll
export const getUserVote = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));

    const { pollId } = req.params;
    const userVote = await getUserVoteInPoll(pollId, payload.userId);
    res.json(baseResponse({ 
      success: true, 
      data: userVote 
    }));
  } catch (err) {
    console.error('Get user vote error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

export const getEventPollsController = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    const userId = payload?.userId;
    if (!eventId)
      return res.status(400).json(errorResponse('eventId wajib diisi'));
    const polls = await getEventPolls(eventId);
    const enhancedPolls = await Promise.all(
      polls.map(async (poll) => {
        const pollStats = await getPollWithVoteStats(poll.id, userId);
        return pollStats;
      })
    );
    res.json(baseResponse({ 
      success: true, 
      data: enhancedPolls 
    }));
  } catch (err) {
    console.error('Get event polls error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};

// Delete poll by pollId
export const deletePollController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const payload = token ? (verifyJwt(token) as JWTPayload) : null;
    if (!payload)
      return res.status(401).json(errorResponse('Unauthorized'));
    
    const { pollId, eventId } = req.params;
    if (!pollId)
      return res.status(400).json(errorResponse('pollId wajib diisi'));
    const pollExists = await getPollWithVoteStats(pollId);
    if (!pollExists) {
      return res.status(404).json(errorResponse('Poll tidak ditemukan'));
    }
    await deletePoll(pollId);
    emitPollDeleted(eventId, {
      pollId,
      eventId
    });
    res.json(baseResponse({ 
      success: true, 
      message: 'Poll berhasil dihapus' 
    }));
  } catch (err) {
    console.error('Delete poll error:', err);
    res.status(500).json(errorResponse(err instanceof Error ? err.message : 'Unknown error'));
  }
};