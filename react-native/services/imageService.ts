import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

export type PickedImage = {
  base64?: string;
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileSize?: number; // in bytes if available
};

export type ImageConstraints = {
  maxWidth: number; // e.g., 1600
  maxHeight: number; // e.g., 1200
  maxBytes: number; // e.g., 1_000_000
  allowedMimeTypes: string[]; // ["image/jpeg", "image/png"]
  compress: number; // 0..1 for JPEG
};

const DEFAULT_CONSTRAINTS: ImageConstraints = {
  maxWidth: 1600,
  maxHeight: 1200,
  maxBytes: 900_000,
  allowedMimeTypes: ["image/jpeg", "image/png"],
  compress: 0.8,
};

export async function requestMediaLibraryPermission() {
  const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!res.granted) throw new Error("Media library permission denied");
}

export async function requestCameraPermission() {
  const res = await ImagePicker.requestCameraPermissionsAsync();
  if (!res.granted) throw new Error("Camera permission denied");
}

export async function pickFromLibrary(options?: Partial<ImageConstraints>): Promise<PickedImage | null> {
  const constraints = { ...DEFAULT_CONSTRAINTS, ...(options ?? {}) };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
    base64: true,
    exif: false,
  });
  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;
  const picked: PickedImage = {
    base64: asset.base64 ?? undefined,
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    mimeType: asset.mimeType,
    fileSize: (asset as any).fileSize ?? undefined,
  };

  validateImageBasics(picked, constraints);
  return ensureConstraints(picked, constraints);
}

export async function captureFromCamera(options?: Partial<ImageConstraints>): Promise<PickedImage | null> {
  const constraints = { ...DEFAULT_CONSTRAINTS, ...(options ?? {}) };

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 1,
    base64: true,
    exif: false,
  });
  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;
  const picked: PickedImage = {
    base64: asset.base64 ?? undefined,
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    mimeType: asset.mimeType,
    fileSize: (asset as any).fileSize ?? undefined,
  };

  validateImageBasics(picked, constraints);
  return ensureConstraints(picked, constraints);
}

function validateImageBasics(image: PickedImage, constraints: ImageConstraints) {
  if (!image.width || !image.height) throw new Error("Image dimensions unavailable");
  if (image.mimeType && !constraints.allowedMimeTypes.includes(image.mimeType)) {
    throw new Error("Unsupported image type");
  }
}

async function ensureConstraints(image: PickedImage, constraints: ImageConstraints): Promise<PickedImage> {
  // Resize if needed maintaining aspect ratio
  const needsResize = image.width > constraints.maxWidth || image.height > constraints.maxHeight;

  let processed: PickedImage = image;
  if (needsResize) {
    const scale = Math.min(constraints.maxWidth / image.width, constraints.maxHeight / image.height);
    const targetWidth = Math.round(image.width * scale);
    const targetHeight = Math.round(image.height * scale);

    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      {
        compress: constraints.compress,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    processed = {
      base64: manipulated.base64,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      mimeType: "image/jpeg",
    };
  } else if (!image.base64 || (image.mimeType && image.mimeType !== "image/jpeg")) {
    // Re-encode to jpeg, include base64
    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [],
      { compress: constraints.compress, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    processed = {
      base64: manipulated.base64,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      mimeType: "image/jpeg",
    };
  }

  // Enforce byte size by iterative compression if necessary (rough approach)
  if (processed.base64) {
    const byteLength = Math.ceil((processed.base64.length * 3) / 4);
    if (byteLength > constraints.maxBytes) {
      let quality = constraints.compress;
      let current = processed;
      for (let i = 0; i < 4; i++) {
        quality = Math.max(0.4, quality - 0.15);
        const manipulated = await ImageManipulator.manipulateAsync(
          current.uri,
          [],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        current = {
          base64: manipulated.base64,
          uri: manipulated.uri,
          width: manipulated.width,
          height: manipulated.height,
          mimeType: "image/jpeg",
        };
        const currBytes = Math.ceil((current.base64!.length * 3) / 4);
        if (currBytes <= constraints.maxBytes) break;
      }
      processed = current;
    }
  }

  return processed;
}
