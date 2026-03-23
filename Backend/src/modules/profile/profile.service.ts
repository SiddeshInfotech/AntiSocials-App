import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { UpdateProfileInput } from "./profile.schema";

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
    select: {
      id: true,
      name: true,
      username: true,
      profilePhoto: true,
      profession: true,
      about: true,
      interests: true,
      isProfileComplete: true,
    },
  });

  return updatedUser;
}

export async function getUserProfile(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      profilePhoto: true,
      profession: true,
      about: true,
      interests: true,
      isProfileComplete: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
