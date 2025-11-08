import { Router, Request,Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { hashPassword, verifyPassword, generateToken, authenticateToken, AuthRequest } from '../utils/auth';
import { registerValidation, loginValidation } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimiter';


const router = Router();

// Register
router.post('/register', authLimiter, registerValidation, async (req:Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        skillLevel: 'beginner',
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      currentLanguage: user.currentLanguage,
      totalPoints: user.totalPoints,
      streakDays: user.streakDays,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', authLimiter, loginValidation, async (req:Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      currentLanguage: user.currentLanguage,
      totalPoints: user.totalPoints,
      streakDays: user.streakDays,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json({ user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      currentLanguage: user.currentLanguage,
      totalPoints: user.totalPoints,
      streakDays: user.streakDays,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.json(userData);
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
