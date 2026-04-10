import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { validateImage } from "../../utils/imageValidation";
import {
  OnboardingInterestsInput,
  PatchProfileInput,
  UpdateProfileInput,
} from "./profile.schema";

const profileSelect = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  profession: true,
  about: true,
  interests: true,
  isPrivate: true,
  emailNotificationsEnabled: true,
  isProfileComplete: true,
};

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<any> {
  const existingUsername = await prisma.user.findFirst({
    where: {
      username: input.username,
      NOT: { id: userId },
    },
  });

  if (existingUsername) {
    throw new AppError("Username is already taken", 409);
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, isProfileComplete: true },
  });

  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  // Prevent changing username if the profile is already complete and a username was set.
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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      isProfileComplete: true,
    },
    select: profileSelect,
  });

  return updatedUser;
}

export async function patchUserProfile(
  userId: string,
  input: PatchProfileInput,
): Promise<any> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, isProfileComplete: true },
  });

  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  if (input.username && input.username !== currentUser.username) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: input.username,
        NOT: { id: userId },
      },
    });

    if (existingUsername) {
      throw new AppError("Username is already taken", 409);
    }

    if (currentUser.username && currentUser.isProfileComplete) {
      throw new AppError(
        "Username cannot be changed after profile is created",
        400,
      );
    }
  }

  if (input.profilePhoto) {
    validateImage(input.profilePhoto);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: profileSelect,
  });

  return updatedUser;
}

export async function getUserProfile(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function patchOnboardingInterests(
  userId: string,
  input: OnboardingInterestsInput,
): Promise<any> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
    },
  });

  if (!currentUser) {
    throw new AppError("User not found", 404);
  }

  if (!input.interests) {
    if (currentUser.interests.length >= 3) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: profileSelect,
      });
    }

    throw new AppError("Please select at least 3 interests", 400);
  }

  const normalizedInterests = input.interests.map((interest) =>
    interest.trim(),
  );

  const uniqueInterests = Array.from(new Set(normalizedInterests));

  if (uniqueInterests.length < 3) {
    throw new AppError("Please select at least 3 unique interests", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      interests: uniqueInterests,
    },
    select: profileSelect,
  });
}
