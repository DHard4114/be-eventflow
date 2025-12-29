/**
 * @file poll.ts
 * @module types/poll
 * @author eventFlow Team
 * @description Type definitions for Poll, PollOption, and PollVote entities.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 */
export interface Poll {
  id: string;
  eventId: string;
  question: string;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  votes: number;
}

export interface PollVote {
  pollOptionId: string;
  userId: string;
  votedAt: Date;
  virtualAreaId?: string;
  notificationId?: string;
}
