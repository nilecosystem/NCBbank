import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const adminRouter = Router();

// GET /api/admin/overview
adminRouter.get('/overview', (req: Request, res: Response) => {
  const data = db.getData();
  const totalTvlUsd = 48500000;
  const totalVolume24hUsd = 12450000;
  const verifiedClientsCount = 1420;
  
  return res.json({
    success: true,
    stats: {
      totalTvlUsd,
      totalVolume24hUsd,
      verifiedClientsCount,
      activePositionsCount: data.investments.length,
      activeCardsCount: data.cards.length,
      auditLogsCount: data.auditLogs.length
    },
    users: data.users,
    auditLogs: data.auditLogs.slice(0, 50)
  });
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const data = db.getData();
  return res.json({
    success: true,
    logs: data.auditLogs
  });
});
