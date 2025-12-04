import { prisma } from '../config/prisma';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { ReportAIResultInput } from '../types/ai';

function toPrismaJson(val: object | undefined): InputJsonValue {
  if (val === null || val === undefined) return {};
  return val;
}

export async function createReportAIResult(data: ReportAIResultInput) {
  return prisma.reportAIResult.create({
    data: {
      ...data,
      aiPayload: toPrismaJson(data.aiPayload ?? {}),
      meta: toPrismaJson(data.meta ?? {})
    }
  });
}
export async function getReportAIResultsByReportId(reportId: string) {
  return prisma.reportAIResult.findMany({ where: { reportId } });
}

export async function getReportAIResultById(id: string) {
  return prisma.reportAIResult.findUnique({ where: { id } });
}

export async function updateReportAIResult(id: string, data: Partial<ReportAIResultInput>) {
  return prisma.reportAIResult.update({
    where: { id },
    data: {
      ...data,
      aiPayload: data.aiPayload !== undefined ? toPrismaJson(data.aiPayload ?? {}) : undefined,
      meta: data.meta !== undefined ? toPrismaJson(data.meta ?? {}) : undefined
    }
  });
}

export async function deleteReportAIResult(id: string) {
  return prisma.reportAIResult.delete({ where: { id } });
}
