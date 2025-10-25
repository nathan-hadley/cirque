import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

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

export async function pickFromLibrary(
  options?: Partial<ImageConstraints>
): Promise<PickedImage | null> {
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

  return ensureConstraints(picked, constraints);
}

export async function captureFromCamera(
  options?: Partial<ImageConstraints>
): Promise<PickedImage | null> {
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

  return ensureConstraints(picked, constraints);
}

async function ensureConstraints(
  image: PickedImage,
  constraints: ImageConstraints
): Promise<PickedImage> {
  const TARGET_ASPECT = 4 / 3;
  const actions: any[] = [];

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
  const effectiveWidth = actions.length > 0 ? actions[0].crop.width : image.width;
  const effectiveHeight = actions.length > 0 ? actions[0].crop.height : image.height;

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
