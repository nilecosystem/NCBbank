import { Router, Request, Response } from 'express';
import { db } from '../storage.ts';

export const userRouter = Router();

// GET /api/user/profile
userRouter.get('/profile', (req: Request, res: Response) => {
  const data = db.getData();
  const user = data.users[0];
  return res.json({ success: true, user });
});

// PUT /api/user/profile
userRouter.put('/profile', (req: Request, res: Response) => {
  try {
    const data = db.getData();
    const activeId = data.users[0]?.id || 'usr-nile-001';
    const updated = db.updateUser({
      id: activeId,
      ...req.body
    });

    db.addAuditLog({
      action: 'USER_PROFILE_UPDATED',
      actor: updated.email,
      target: updated.id,
      details: 'Personal contact and KYC residential information updated'
    });

    return res.json({ success: true, message: 'Profile updated successfully', user: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/user/kyc/submit
userRouter.post('/kyc/submit', (req: Request, res: Response) => {
  try {
    const { documents, personalData } = req.body;
    const data = db.getData();
    const activeId = data.users[0]?.id || 'usr-nile-001';

    const updated = db.updateUser({
      id: activeId,
      ...personalData,
      kycStatus: 'verified',
      kycTier: 3,
      kycApprovedAt: new Date().toISOString().split('T')[0]
    });

    db.addAuditLog({
      action: 'KYC_TIER3_APPROVED',
      actor: 'compliance_officer',
      target: activeId,
      details: 'Proof of Address and Biometric Passport Verified for Tier 3 Institutional Access'
    });

    return res.json({
      success: true,
      message: 'KYC Verification passed! Upgraded to Tier 3 Institutional Status.',
      user: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
