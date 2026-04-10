import { AuthMethod, LifeCircleParameter, Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { sendWhatsAppOtp } from "../../integrations/whatsapp";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { validateImage } from "../../utils/imageValidation";
import { signAccessToken } from "../../utils/jwt";
import {
  generateOtp,
  getCooldownThreshold,
  getOtpExpiryDate,
} from "../../utils/otp";
import { comparePassword, hashPassword } from "../../utils/password";
import {
  CompleteSignupInput,
  LoginEmailInput,
  RegisterEmailInput,
  SendOtpInput,
  VerifyOtpInput,
} from "./auth.schema";

const authProfileSelect = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  profession: true,
  about: true,
  interests: true,
  isProfileComplete: true,
};

async function initializeUserDefaults(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.userWallet.create({
    data: { userId },
  });

  await tx.userStreak.create({
    data: {
      userId,
      currentStreak: 0,
      bestStreak: 0,
    },
  });

  await tx.lifeCircleScore.createMany({
    data: Object.values(LifeCircleParameter).map((parameter) => ({
      userId,
      parameter,
      score: 0,
    })),
  });
}

export async function registerWithEmail(
  input: RegisterEmailInput,
): Promise<{ accessToken: string; isProfileComplete: boolean }> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          timezone: input.timezone || env.DEFAULT_TIMEZONE,
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: createdUser.id,
          method: AuthMethod.EMAIL,
          isVerified: true,
        },
      });

      await initializeUserDefaults(tx, createdUser.id);

      return createdUser;
    },
  );

  return {
    accessToken: signAccessToken(user.id),
    isProfileComplete: user.isProfileComplete,
  };
}

export async function sendOtpForPhoneLogin(
  input: SendOtpInput,
): Promise<{ resendAfterSeconds: number }> {
  const normalizedPhone = input.phone.trim();
  const cooldownThreshold = getCooldownThreshold(
    env.OTP_RESEND_COOLDOWN_SECONDS,
  );

  const lastOtp = await prisma.oTPVerification.findFirst({
    where: { phone: normalizedPhone },
    orderBy: { createdAt: "desc" },
  });

  if (lastOtp && lastOtp.createdAt > cooldownThreshold) {
    throw new AppError(
      `Please wait ${env.OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP`,
      429,
    );
  }

  const otp = generateOtp(6);
  const otpHash = await hashPassword(otp);
  const expiresAt = getOtpExpiryDate(env.OTP_EXPIRY_MINUTES);

  const createdOtp = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.oTPVerification.updateMany({
        where: {
          phone: normalizedPhone,
          isUsed: false,
        },
        data: {
          isUsed: true,
        },
      });

      return tx.oTPVerification.create({
        data: {
          phone: normalizedPhone,
          otpHash,
          expiresAt,
        },
      });
    },
  );

  try {
    await sendWhatsAppOtp({
      to: normalizedPhone,
      otp,
    });
  } catch {
    await prisma.oTPVerification.update({
      where: { id: createdOtp.id },
      data: { isUsed: true },
    });
    throw new AppError(
      "Failed to send OTP on WhatsApp. Please try again.",
      502,
    );
  }

  return { resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS };
}

export async function verifyPhoneOtpAndLogin(input: VerifyOtpInput): Promise<{
  accessToken: string;
  isNewUser: boolean;
  isProfileComplete: boolean;
}> {
  const normalizedPhone = input.phone.trim();
  const otpRecord = await prisma.oTPVerification.findFirst({
    where: {
      phone: normalizedPhone,
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("OTP not found. Request a new OTP.", 400);
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    throw new AppError("OTP has expired. Request a new OTP.", 400);
  }

  if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    throw new AppError(
      "Maximum OTP attempts exceeded. Request a new OTP.",
      429,
    );
  }

  const isMatch = await comparePassword(input.otp, otpRecord.otpHash);

  if (!isMatch) {
    const nextAttempts = otpRecord.attempts + 1;
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: nextAttempts,
        isUsed: nextAttempts >= env.OTP_MAX_ATTEMPTS,
      },
    });
    throw new AppError("Invalid OTP", 400);
  }

  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      const existingUser = await tx.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingUser) {
        return { user: existingUser, isNewUser: false };
      }

      const createdUser = await tx.user.create({
        data: {
          phone: normalizedPhone,
          timezone: env.DEFAULT_TIMEZONE,
        },
      });

      await tx.authIdentity.create({
        data: {
          userId: createdUser.id,
          method: AuthMethod.PHONE,
          isVerified: true,
        },
      });

      await initializeUserDefaults(tx, createdUser.id);

      return { user: createdUser, isNewUser: true };
    },
  );

  return {
    accessToken: signAccessToken(user.user.id),
    isNewUser: user.isNewUser,
    isProfileComplete: user.user.isProfileComplete,
  };
}

export async function loginWithEmail(
  input: LoginEmailInput,
): Promise<{ accessToken: string; isProfileComplete: boolean }> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.passwordHash) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await comparePassword(input.password, user.passwordHash);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    accessToken: signAccessToken(user.id),
    isProfileComplete: user.isProfileComplete,
  };
}

export async function completeSignupAfterAuth(
  userId: string,
  input: CompleteSignupInput,
): Promise<any> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, isProfileComplete: true },
  });

  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  const existingUsername = await prisma.user.findFirst({
    where: {
      username: input.username,
      NOT: { id: userId },
    },
  });

  if (existingUsername) {
    throw new AppError("Username is already taken", 409);
  }

  if (
    currentUser.username &&
    currentUser.username !== input.username &&
    currentUser.isProfileComplete
  ) {
    throw new AppError(
      "Username cannot be changed after profile is created",
      400,
    );
  }

  if (input.profilePhoto?.startsWith("data:image/")) {
    validateImage(input.profilePhoto);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      username: input.username,
      profession: input.profession,
      about: input.about,
      profilePhoto: input.profilePhoto,
      timezone: input.timezone,
      isProfileComplete: true,
    },
    select: authProfileSelect,
  });
}

export async function logoutCurrentSession(input: {
  userId: string;
  tokenJti: string;
  tokenExp: number;
}): Promise<void> {
  const expiresAt = new Date(input.tokenExp * 1000);

  await prisma.revokedToken.upsert({
    where: { tokenJti: input.tokenJti },
    update: {},
    create: {
      userId: input.userId,
      tokenJti: input.tokenJti,
      expiresAt,
    },
  });
}
