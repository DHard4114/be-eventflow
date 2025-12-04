

export interface ReportAIResultInput {
  reportId: string;
  aiType: string;
  aiPayload: object;
  status: string;
  errorMsg?: string | null;
  meta?: object | null;
  createdAt?: Date;
}