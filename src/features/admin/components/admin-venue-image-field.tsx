"use client";

import {
  type ChangeEvent,
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { heicTo, isHeic } from "heic-to/csp";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import styles from "./admin-venue-image-field.module.css";

const MAX_IMAGE_COUNT = 8;
const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.82;

type AdminVenueImageFieldProps = {
  initialUrls: string[];
};

type ExistingImageItem = {
  id: string;
  kind: "existing";
  url: string;
};

type NewImageItem = {
  id: string;
  kind: "new";
  file: File;
  previewUrl: string;
};

type ImageItem = ExistingImageItem | NewImageItem;

type ImageOrderEntry =
  | {
      kind: "existing";
      url: string;
    }
  | {
      kind: "new";
      fileName: string;
    };

export function AdminVenueImageField({ initialUrls }: AdminVenueImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImageItem[]>([]);
  const pendingFileSequenceRef = useRef(0);
  const [items, setItems] = useState<ImageItem[]>(() =>
    initialUrls.map((url, index) => ({
      id: `existing-${index}`,
      kind: "existing",
      url,
    })),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const imageOrderJson = useMemo(
    () =>
      JSON.stringify(
        items.map((item): ImageOrderEntry =>
          item.kind === "existing"
            ? { kind: "existing", url: item.url }
            : { kind: "new", fileName: item.file.name },
        ),
      ),
    [items],
  );

  useEffect(() => {
    itemsRef.current = items;
    syncFileInput(fileInputRef.current, items);
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.kind === "new") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGE_COUNT - items.length;

    if (remainingSlots <= 0) {
      setMessage(`경기장 이미지는 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있습니다.`);
      event.target.value = "";
      return;
    }

    setIsProcessing(true);
    setMessage("");

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    const nextItems: NewImageItem[] = [];
    const failures: string[] = [];

    for (const file of filesToProcess) {
      try {
        const normalizedFile = await normalizeVenueImageFile(
          file,
          createPendingFileName(file.name, pendingFileSequenceRef),
        );

        nextItems.push({
          id: `new-${normalizedFile.name}`,
          kind: "new",
          file: normalizedFile,
          previewUrl: URL.createObjectURL(normalizedFile),
        });
      } catch {
        failures.push(file.name);
      }
    }

    setItems((current) => [...current, ...nextItems]);

    if (failures.length > 0) {
      setMessage(`일부 파일을 처리하지 못했습니다: ${failures.join(", ")}`);
    } else if (selectedFiles.length > filesToProcess.length) {
      setMessage(`최대 ${MAX_IMAGE_COUNT}장까지만 등록할 수 있습니다.`);
    }

    setIsProcessing(false);
    event.target.value = "";
  }

  function moveItem(itemId: string, direction: "left" | "right") {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);

      if (index < 0) {
        return current;
      }

      const nextIndex = direction === "left" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = current.slice();
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function setRepresentative(itemId: string) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);

      if (index <= 0) {
        return current;
      }

      const next = current.slice();
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  }

  function removeItem(itemId: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === itemId);

      if (target?.kind === "new") {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((item) => item.id !== itemId);
    });
  }

  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>경기장 이미지</p>
          <p className={styles.hint}>
            매치 상세에는 이 순서대로 경기장 사진이 노출됩니다. 첫 번째 이미지가 대표입니다.
          </p>
        </div>
        <span className={styles.meta}>
          {items.length} / {MAX_IMAGE_COUNT}
        </span>
      </div>

      <input name="imageOrderJson" type="hidden" value={imageOrderJson} />
      <input
        accept="image/*,.heic,.heif"
        className={styles.input}
        disabled={isProcessing}
        multiple
        name="imageFiles"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {message ? <p className={styles.message}>{message}</p> : null}

      {items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((item, index) => {
            const previewUrl = item.kind === "existing" ? item.url : item.previewUrl;

            return (
              <div className={styles.card} key={item.id}>
                <div className={styles.thumbWrap}>
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className={styles.thumb} src={previewUrl} />
                  ) : (
                    <div className={styles.placeholder}>이미지 미리보기</div>
                  )}
                  {index === 0 ? <span className={styles.badge}>대표 이미지</span> : null}
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    disabled={index === 0}
                    onClick={() => setRepresentative(item.id)}
                    type="button"
                  >
                    대표로 설정
                  </button>
                  <button
                    className={styles.actionButton}
                    disabled={index === 0}
                    onClick={() => moveItem(item.id, "left")}
                    type="button"
                  >
                    <ArrowLeftIcon className={styles.actionIcon} />
                    왼쪽
                  </button>
                  <button
                    className={styles.actionButton}
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(item.id, "right")}
                    type="button"
                  >
                    오른쪽
                    <ArrowRightIcon className={styles.actionIcon} />
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => removeItem(item.id)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.hint}>아직 등록된 경기장 사진이 없습니다.</p>
      )}
    </div>
  );
}

function syncFileInput(input: HTMLInputElement | null, items: ImageItem[]) {
  if (!input) {
    return;
  }

  const transfer = new DataTransfer();

  items.forEach((item) => {
    if (item.kind === "new") {
      transfer.items.add(item.file);
    }
  });

  input.files = transfer.files;
}

async function normalizeVenueImageFile(file: File, fileName: string) {
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

  const safeBaseName = baseName || "venue-image";

  return `${safeBaseName}-${Date.now()}-${sequenceRef.current}.webp`;
}

function getScaledSize(width: number, height: number) {
  const largestEdge = Math.max(width, height);

  if (largestEdge <= MAX_SIDE) {
    return { height, width };
  }

  const ratio = MAX_SIDE / largestEdge;

  return {
    width: Math.max(Math.round(width * ratio), 1),
    height: Math.max(Math.round(height * ratio), 1),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to convert canvas to blob"));
        return;
      }

      resolve(blob);
    }, type, quality);
  });
}
