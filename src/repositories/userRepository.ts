/**
 * @file userRepository.ts
 * @module repositories/userRepository
 * @author eventFlow Team
 * @description Repository for querying and updating user data in the database using Prisma ORM.
 * @created 2025-11-10
 * @lastModified 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency Prisma
 */
import { prisma, Prisma, User } from '../config/prisma';

export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  return prisma.user.create({ data });
};

export const updateUser = async (id: string, data: Prisma.UserUpdateInput): Promise<User> => {
  return prisma.user.update({ where: { id }, data });
};

export const deleteUser = async (id: string): Promise<User> => {
  return prisma.user.delete({ where: { id } });
};
