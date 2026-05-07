"use client";

import {
  type ChangeEvent,
  type MutableRefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { heicTo, isHeic } from "heic-to/csp";
import styles from "./admin-banner-image-field.module.css";

const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.82;

type AdminBannerImageFieldProps = {
  initialUrl?: string;
};

export function AdminBannerImageField({ initialUrl = "" }: AdminBannerImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileSequenceRef = useRef(0);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [objectUrl, setObjectUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsProcessing(true);
    setMessage("");

    try {
      const normalizedFile = await normalizeBannerImageFile(
        file,
        createPendingFileName(file.name, pendingFileSequenceRef),
      );
      const nextObjectUrl = URL.createObjectURL(normalizedFile);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setObjectUrl(nextObjectUrl);
      setPreviewUrl(nextObjectUrl);
      syncFileInput(fileInputRef.current, normalizedFile);
    } catch {
      setMessage("이미지를 처리하지 못했습니다. 다른 파일을 선택해 주세요.");
      event.target.value = "";
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>배너 이미지</p>
          <p className={styles.hint}>권장 비율은 1176 x 391입니다. 모바일도 같은 비율로 노출됩니다.</p>
        </div>
      </div>

      <input
        accept="image/*,.heic,.heif"
        className={styles.input}
        disabled={isProcessing}
        name="imageFile"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.previewWrap}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className={styles.preview} src={previewUrl} />
        ) : (
          <div className={styles.placeholder}>배너 이미지 미리보기</div>
        )}
      </div>
    </div>
  );
}

function syncFileInput(input: HTMLInputElement | null, file: File) {
  if (!input) {
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

async function normalizeBannerImageFile(file: File, fileName: string) {
  const bitmap = await loadImageBitmap(file);

  try {
    const { height, width } = getScaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const webpBlob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);

    return new File([webpBlob], fileName, {
      lastModified: Date.now(),
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
}

async function loadImageBitmap(file: File) {
  if (await shouldConvertHeic(file)) {
    return heicTo({
      blob: file,
      type: "bitmap",
    });
  }

  return createImageBitmap(file);
}

async function shouldConvertHeic(file: File) {
  if (file.type === "image/heic" || file.type === "image/heif") {
    return true;
  }

  if (/\.(heic|heif)$/i.test(file.name)) {
    return true;
  }

  return isHeic(file);
}

function createPendingFileName(originalName: string, sequenceRef: MutableRefObject<number>) {
  sequenceRef.current += 1;
  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeBaseName = baseName || "home-banner";

  return `${safeBaseName}-${Date.now()}-${sequenceRef.current}.webp`;
}

function getScaledSize(width: number, height: number) {
  const largestEdge = Math.max(width, height);

  if (largestEdge <= MAX_SIDE) {
    return { height, width };
  }

  const ratio = MAX_SIDE / largestEdge;

  return {
    height: Math.round(height * ratio),
    width: Math.round(width * ratio),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to encode image"));
      },
      type,
      quality,
    );
  });
}
