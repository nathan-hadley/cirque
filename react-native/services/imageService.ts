import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PickedImage = {
  base64?: string;
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
};

export type NormalizedPoint = [number, number];

export type ImageConstraints = {
  maxWidth: number; // e.g., 640
  maxHeight: number; // e.g., 480
  maxBytes: number; // e.g., 200_000
  allowedMimeTypes: string[]; // ["image/jpeg", "image/png"]
  compress: number; // 0..1 for JPEG
};

const DEFAULT_CONSTRAINTS: ImageConstraints = {
  maxWidth: 640,
  maxHeight: 480,
  maxBytes: 200_000,
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

export async function pickFromLibrary(
  options?: Partial<ImageConstraints>
): Promise<PickedImage | null> {
  const constraints = { ...DEFAULT_CONSTRAINTS, ...(options ?? {}) };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
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
  };

  return ensureConstraints(picked, constraints);
}

export async function captureFromCamera(
  options?: Partial<ImageConstraints>
): Promise<PickedImage | null> {
  const constraints = { ...DEFAULT_CONSTRAINTS, ...(options ?? {}) };

  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      base64: true,
      exif: false,
    });
  } catch (error) {
    console.error("Camera launch failed:", error);
    throw error;
  }

  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;

  const picked: PickedImage = {
    base64: asset.base64 ?? undefined,
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    mimeType: asset.mimeType,
  };

  return ensureConstraints(picked, constraints);
}

async function ensureConstraints(
  image: PickedImage,
  constraints: ImageConstraints
): Promise<PickedImage> {
  const TARGET_ASPECT = 4 / 3;
  const actions: ImageManipulator.Action[] = [];

  // First, crop to 4:3 aspect ratio if needed
  const currentAspect = image.width / image.height;
  if (Math.abs(currentAspect - TARGET_ASPECT) > 0.01) {
    // Crop from center to achieve 4:3
    let cropWidth = image.width;
    let cropHeight = image.height;
    let originX = 0;
    let originY = 0;

    if (currentAspect > TARGET_ASPECT) {
      // Image is wider than 4:3, crop width
      cropWidth = Math.round(image.height * TARGET_ASPECT);
      originX = Math.round((image.width - cropWidth) / 2);
    } else {
      // Image is taller than 4:3, crop height
      cropHeight = Math.round(image.width / TARGET_ASPECT);
      originY = Math.round((image.height - cropHeight) / 2);
    }

    actions.push({
      crop: {
        originX,
        originY,
        width: cropWidth,
        height: cropHeight,
      },
    });
  }

  // Then resize if needed
  const effectiveWidth =
    actions.length > 0 ? (actions[0] as ImageManipulator.ActionCrop).crop.width : image.width;
  const effectiveHeight =
    actions.length > 0 ? (actions[0] as ImageManipulator.ActionCrop).crop.height : image.height;

  if (effectiveWidth > constraints.maxWidth || effectiveHeight > constraints.maxHeight) {
    const scale = Math.min(
      constraints.maxWidth / effectiveWidth,
      constraints.maxHeight / effectiveHeight
    );
    const targetWidth = Math.round(effectiveWidth * scale);
    const targetHeight = Math.round(effectiveHeight * scale);
    actions.push({ resize: { width: targetWidth, height: targetHeight } });
  }

  // Process image with all transformations
  let processed: PickedImage;
  if (actions.length > 0 || !image.base64 || (image.mimeType && image.mimeType !== "image/jpeg")) {
    const manipulated = await ImageManipulator.manipulateAsync(image.uri, actions, {
      compress: constraints.compress,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    processed = {
      base64: manipulated.base64,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      mimeType: "image/jpeg",
    };
  } else {
    processed = image;
  }

  // Enforce byte size by iterative compression if necessary (rough approach)
  if (processed.base64) {
    const byteLength = Math.ceil((processed.base64.length * 3) / 4);
    if (byteLength > constraints.maxBytes) {
      let quality = constraints.compress;
      let current = processed;
      for (let i = 0; i < 4; i++) {
        quality = Math.max(0.4, quality - 0.15);
        const manipulated = await ImageManipulator.manipulateAsync(current.uri, [], {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        });
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

/**
 * Converts normalized points (0-1) to pixel coordinates (640×480)
 * for submission to the API and storage in GeoJSON format
 */
export function convertNormalizedToPixels(normalizedPoints: NormalizedPoint[]): [number, number][] {
  return normalizedPoints.map(([x, y]): [number, number] => [
    Math.round(x * DEFAULT_CONSTRAINTS.maxWidth),
    Math.round(y * DEFAULT_CONSTRAINTS.maxHeight),
  ]);
}

/**
 * Downsample points to a maximum count while maintaining shape
 * Uses evenly distributed sampling across the point array
 */
export function downsamplePoints(
  points: NormalizedPoint[],
  maxPoints: number = 10
): NormalizedPoint[] {
  if (points.length <= maxPoints) {
    return points;
  }

  const result: NormalizedPoint[] = [];
  const step = (points.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }

  return result;
}
