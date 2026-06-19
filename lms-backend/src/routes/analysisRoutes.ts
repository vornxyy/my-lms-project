import { Router } from 'express';
import { prisma } from '../config/db.js';

export const router = Router();

router.get('/summary', async (_req, res) => {
  try {
    const totalRecords = await prisma.labTrackingLog.count();
    const pendingCount = await prisma.labTrackingLog.count({
      where: { status: { equals: 'Pending', mode: 'insensitive' } },
    });
    const inProgressCount = await prisma.labTrackingLog.count({
      where: { status: { equals: 'In Progress', mode: 'insensitive' } },
    });
    const activeEngagements = pendingCount + inProgressCount;
    const completedCount = await prisma.labTrackingLog.count({
      where: { status: { equals: 'Complete', mode: 'insensitive' } },
    });
    const pct = totalRecords > 0
      ? Math.round((completedCount / totalRecords) * 100)
      : 0;
    res.json({ totalRecords, activeEngagements, compliance: `${pct}%` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.get('/records', async (_req, res) => {
  try {
    const records = await prisma.labTrackingLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

router.post('/records', async (req, res) => {
  try {
    const { sampleName, status, operator } = req.body;
    if (!sampleName || !status || !operator) {
      res.status(400).json({ error: 'sampleName, status, and operator are required' });
      return;
    }
    const record = await prisma.labTrackingLog.create({
      data: { sampleName, status, operator },
    });
    res.status(201).json(record);
  } catch (error) {
    console.error('POST /records failed:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sampleName, status, operator } = req.body;
    const record = await prisma.labTrackingLog.update({
      where: { id },
      data: {
        ...(sampleName !== undefined && { sampleName }),
        ...(status !== undefined && { status }),
        ...(operator !== undefined && { operator }),
      },
    });
    res.json(record);
  } catch (error) {
    console.error('PUT /records/:id failed:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.labTrackingLog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      console.error('DELETE /records/:id failed:', error);
      res.status(500).json({ error: 'Failed to delete record' });
    }
  }
});

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:5173',
  });

  const send = async () => {
    try {
      const totalRecords = await prisma.labTrackingLog.count();
      const pendingCount = await prisma.labTrackingLog.count({
        where: { status: { equals: 'Pending', mode: 'insensitive' } },
      });
      const inProgressCount = await prisma.labTrackingLog.count({
        where: { status: { equals: 'In Progress', mode: 'insensitive' } },
      });
      const completedCount = await prisma.labTrackingLog.count({
        where: { status: { equals: 'Complete', mode: 'insensitive' } },
      });
      const pct = totalRecords > 0
        ? Math.round((completedCount / totalRecords) * 100)
        : 0;
      const records = await prisma.labTrackingLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const data = JSON.stringify({
        summary: { totalRecords, activeEngagements: pendingCount + inProgressCount, compliance: `${pct}%` },
        records,
        timestamp: Date.now(),
      });
      res.write(`data: ${data}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'DB error' })}\n\n`);
    }
  };

  const interval = setInterval(send, 4000);
  send();

  req.on('close', () => {
    clearInterval(interval);
  });
});