import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { sendEmail } from '../services/email';
import { isWorkEmail } from '../utils/emailUtils';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT
function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/send-verification
export async function sendVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;

    if (!isWorkEmail(email)) {
      throw new AppError(
        'Please use your work email address to join CommuteMate.',
        400
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Invalidate old tokens
    await prisma.emailVerification.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await prisma.emailVerification.create({
      data: { email, token: otp, expiresAt },
    });

    await sendEmail({
      to: email,
      subject: 'Your CommuteMate verification code',
      text: `Your verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #1D9E75;">CommuteMate</h2>
          <p>Your verification code:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D9E75; padding: 16px 0;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 14px;">Expires in 15 minutes. Don't share this with anyone.</p>
        </div>
      `,
    });

    res.json({ message: 'Verification code sent to your work email.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-email
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, token, name } = req.body;

    const verification = await prisma.emailVerification.findFirst({
      where: { email, token, used: false },
    });

    if (!verification) {
      throw new AppError('Invalid verification code.', 400);
    }

    if (new Date() > verification.expiresAt) {
      throw new AppError('Verification code has expired. Please request a new one.', 400);
    }

    // Mark token as used
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: { emailVerified: true },
      create: { email, name, emailVerified: true },
    });

    const jwtToken = generateToken(user.id);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        vehicleType: user.vehicleType,
        vehicleSeats: user.vehicleSeats,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // New user — send verification for signup
      req.body.name = email.split('@')[0]; // placeholder name
      return sendVerificationEmail(req, res, next);
    }

    // Existing user — send new OTP
    return sendVerificationEmail(req, res, next);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const newToken = generateToken(decoded.userId);
    res.json({ token: newToken });
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
}
