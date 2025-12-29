
/**
 * @file pollRepository.ts
 * @module repositories/pollRepository
 * @author eventFlow Team
 * @description Repository for Poll, PollOption, and PollVote database operations with optimized counting.
 * @created 2025-11-11
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma
 */
import { prisma, PollOption, PollVote, Poll } from '../config/prisma';

export const createPoll = async (data: {
  eventId: string;
  question: string;
  options: string[];
}): Promise<Poll> => {
  return await prisma.poll.create({
    data: {
      eventId: data.eventId,
      question: data.question,
      options: {
        create: data.options.map(text => ({ text })),
      },
    },
    include: { 
      options: {
        include: {
          _count: {
            select: { pollVotes: true }
          }
        }
      } 
    },
  });
};

export const submitPollVote = async (data: {
  pollOptionId: string;
  userId: string;
}): Promise<{vote: PollVote, updatedOptions: PollOption[]}> => {
  return await prisma.$transaction(async (tx) => {
    // Delete existing vote from user in the same poll
    const pollOption = await tx.pollOption.findUnique({
      where: { id: data.pollOptionId },
      include: { poll: true }
    });

    if (!pollOption) {
      throw new Error('Poll option not found');
    }

    // Delete any existing votes by this user in the same poll
    await tx.pollVote.deleteMany({
      where: {
        userId: data.userId,
        pollOption: {
          pollId: pollOption.pollId
        }
      }
    });

    // Create new vote
    const vote = await tx.pollVote.create({
      data,
      include: {
        pollOption: {
          include: {
            _count: {
              select: { pollVotes: true }
            }
          }
        }
      }
    });

    // Get updated options with vote counts
    const updatedOptions = await tx.pollOption.findMany({
      where: { pollId: pollOption.pollId },
      include: {
        _count: {
          select: { pollVotes: true }
        },
        pollVotes: {
          where: { userId: data.userId },
          select: { userId: true }
        }
      }
    });

    // Transform data to include votes count
    const transformedOptions = updatedOptions.map(option => ({
      ...option,
      votes: option._count.pollVotes,
      userVoted: option.pollVotes.length > 0
    }));

    return { vote, updatedOptions: transformedOptions };
  });
};

export const getEventPolls = async (eventId: string) => {
  return await prisma.poll.findMany({
    where: { eventId },
    include: { 
      options: {
        include: {
          _count: {
            select: { pollVotes: true }
          }
        }
      }
    },
  });
};

export const getPollOptionsWithVotes = async (pollId: string, userId?: string) => {
  const options = await prisma.pollOption.findMany({
    where: { pollId },
    include: {
      _count: {
        select: { pollVotes: true }
      },
      ...(userId ? {
        pollVotes: {
          where: { userId },
          select: { userId: true }
        }
      } : {})
    },
  });

  return options.map(option => ({
    ...option,
    votes: option._count.pollVotes,
    userVoted: userId ? option.pollVotes.length > 0 : undefined
  }));
};

export const deletePollVote = async (pollId: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Delete all votes by this user in the poll
    const deletedVotes = await tx.pollVote.deleteMany({
      where: {
        userId: userId,
        pollOption: {
          pollId: pollId
        }
      }
    });

    // Get updated options with vote counts
    const updatedOptions = await tx.pollOption.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { pollVotes: true }
        }
      }
    });

    const transformedOptions = updatedOptions.map(option => ({
      ...option,
      votes: option._count.pollVotes,
      userVoted: false
    }));

    return { deletedCount: deletedVotes.count, updatedOptions: transformedOptions };
  });
};

export const getPollWithVoteStats = async (pollId: string, userId?: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          _count: {
            select: { pollVotes: true }
          },
          ...(userId ? {
            pollVotes: {
              where: { userId },
              select: { userId: true }
            }
          } : {})
        }
      },
      _count: {
        select: {
          options: true
        }
      }
    }
  });

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, option) => sum + option._count.pollVotes, 0);
  
  const enhancedOptions = poll.options.map(option => ({
    ...option,
    votes: option._count.pollVotes,
    percentage: totalVotes > 0 ? Math.round((option._count.pollVotes / totalVotes) * 100) : 0,
    userVoted: userId ? option.pollVotes.length > 0 : undefined
  }));

  return {
    ...poll,
    options: enhancedOptions,
    totalVotes,
    userHasVoted: userId ? enhancedOptions.some(option => option.userVoted) : undefined
  };
};

export const deletePoll = async (pollId: string) => {
  return await prisma.poll.delete({
    where: { id: pollId },
  });
};

export const getUserVoteInPoll = async (pollId: string, userId: string) => {
  return await prisma.pollVote.findFirst({
    where: {
      userId: userId,
      pollOption: {
        pollId: pollId
      }
    },
    include: {
      pollOption: true
    }
  });
};