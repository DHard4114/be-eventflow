/**
 * File: notificationRepository.ts
 * Author: eventFlow Team
 * Deskripsi: Repository untuk query, pembuatan, dan update notifikasi event/user di database.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: Prisma
 */
import { prisma, Prisma, Notification, NotificationType} from '../config/prisma';

export const findNotificationById = async (id: string): Promise<Notification | null> => {
  return prisma.notification.findUnique({ where: { id } });
};

export const listNotifications = async (eventId: string) => {
  return prisma.notification.findMany({ 
    where: { eventId },
    include: {
      userNotifications: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });
};

export const createNotification = async (
  data: Omit<Prisma.NotificationCreateInput, 'event' | 'deliveryMethod'> & { eventId: string, deliveryMethod: 'INDIVIDUAL' | 'BROADCAST' }
): Promise<Notification> => {
  if (!data.eventId) throw new Error('eventId wajib diisi!');
  const { eventId, deliveryMethod, ...rest } = data;
  return prisma.notification.create({
    data: {
      ...rest,
      type: rest.type as NotificationType,
      deliveryMethod,
      event: { connect: { id: eventId } },
    },
  });
};

export const updateNotification = async (
  id: string,
  data: Prisma.NotificationUpdateInput,
): Promise<Notification> => {
  return prisma.notification.update({ where: { id }, data });
};

export const deleteNotification = async (id: string): Promise<Notification> => {
  return prisma.notification.delete({ where: { id } });
};
