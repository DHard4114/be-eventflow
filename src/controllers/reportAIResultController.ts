import { Request, Response } from 'express';
import {
  getReportAIResultsByReportId,
  getReportAIResultById,
  updateReportAIResult,
  deleteReportAIResult
} from '../repositories/reportAIResultRepository';
// ...existing code...


export async function getAIResultsByReport(req: Request, res: Response) {
  try {
    const { reportId } = req.params;
    const results = await getReportAIResultsByReportId(reportId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}

export async function getAIResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await getReportAIResultById(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}

export async function updateAIResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await updateReportAIResult(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}

export async function deleteAIResult(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteReportAIResult(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
}
