import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'customer',
    });

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async login(input: LoginInput): Promise<AuthTokens> {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('User session expired or invalidated');
    }

    const hashedIncoming = hashToken(rawRefreshToken);
    if (user.refreshTokenHash !== hashedIncoming) {
      // Possible token reuse attack - revoke token
      user.refreshTokenHash = null;
      await user.save();
      throw new UnauthorizedError('Refresh token reuse detected; session invalidated');
    }

    // Issue fresh tokens (Rotation)
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async logout(userId?: string): Promise<void> {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  static async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
