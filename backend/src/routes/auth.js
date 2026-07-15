import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const admin = await Admin.findOne({ email: String(email).toLowerCase() });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ token: signToken(admin), name: admin.name, email: admin.email });
});

export default router;
