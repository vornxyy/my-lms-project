import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

export const getAnalysisRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await prisma.analysisRequest.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      }
    });
    
    res.json(requests);
  } catch (error) {
    console.error("Failed to fetch analysis streams:", error);
    res.status(500).json({ error: "Internal Database Server Error" });
  }
};