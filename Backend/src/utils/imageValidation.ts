import { AppError } from "../middleware/error-handler";

/**
 * Magic bytes (file signatures) for supported image formats
 * These are used to validate that uploaded files are actually images
 */
const IMAGE_MAGIC_BYTES: Record<string, string[]> = {
  PNG: ["89504e47"], // PNG: 89 50 4E 47
  JPEG: ["ffd8ffe0", "ffd8ffe1", "ffd8ffe2"], // JPEG variants
  GIF: ["47494638"], // GIF: 47 49 46 38
  WEBP: ["52494646"], // RIFF (WebP), need to check WEBP signature deeper
};

/**
 * Validates that a base64-encoded string represents a valid image file
 * by checking the file's magic bytes (file signature)
 *
 * @param base64String - The base64 string to validate (expected format: "data:image/type;base64,...")
 * @throws AppError if the file is not a valid image
 */
export function validateImageMagicBytes(base64String: string): void {
  try {
    // Extract the base64 data part (after the comma)
    const parts = base64String.split(",");
    if (parts.length !== 2) {
      throw new AppError("Invalid base64 image format", 400);
    }

    const base64Data = parts[1];

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Need at least 4 bytes for magic byte comparison
    if (buffer.length < 4) {
      throw new AppError("Image file too small", 400);
    }

    // Get first 4 bytes as hex string
    const fileSignature = buffer.slice(0, 4).toString("hex");

    // Collect all valid magic bytes
    const allValidSignatures = Object.values(IMAGE_MAGIC_BYTES).flat();

    // Check if the file signature matches any known image format
    const isValidImage = allValidSignatures.some((signature) =>
      fileSignature.startsWith(signature),
    );

    if (!isValidImage) {
      throw new AppError(
        "Invalid image file. Only PNG, JPEG, GIF, and WebP formats are supported.",
        400,
      );
    }

    // Additional WebP validation (RIFF format with WEBP chunk)
    if (fileSignature.startsWith("52494646")) {
      // Check for WEBP signature in the file
      const webpSignature = buffer.slice(8, 12).toString("ascii");
      if (webpSignature !== "WEBP") {
        throw new AppError("Invalid WebP file format", 400);
      }
    }
  } catch (error) {
    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Handle buffer conversion errors
    throw new AppError("Invalid base64 image data", 400);
  }
}

/**
 * Calculates the size of a base64-encoded string in bytes
 * Useful for enforcing file size limits
 *
 * @param base64String - The base64 string to measure
 * @returns The size in bytes
 */
export function getBase64Size(base64String: string): number {
  const parts = base64String.split(",");
  const base64Data = parts.length === 2 ? parts[1] : base64String;

  // Base64 encoding inflates size by ~33%, so we use this formula
  // to get the actual binary size
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

/**
 * Validates both the format and size of a base64 image
 *
 * @param base64String - The base64 string to validate
 * @param maxSizeBytes - Maximum allowed file size in bytes (default: 10MB)
 * @throws AppError if validation fails
 */
export function validateImage(
  base64String: string,
  maxSizeBytes: number = 10 * 1024 * 1024, // 10MB default
): void {
  // Check format
  validateImageMagicBytes(base64String);

  // Check size
  const fileSizeBytes = getBase64Size(base64String);
  if (fileSizeBytes > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    throw new AppError(
      `Image size exceeds maximum limit of ${maxSizeMB}MB`,
      400,
    );
  }
}
