/* =====================================================================
   FileUpload — the Prime FileUpload twin.

   @mantine/dropzone is only the drop area. Prime's FileUpload is an
   action bar (Choose / Upload / Cancel) over a drop area, with a staged
   file list, per-file removal and an upload progress bar — and in
   `auto` mode it skips the bar and uploads on drop. Mantine has no such
   widget, so it lives here.

   Keyboard: Choose opens the native picker via the dropzone's openRef, so
   the flow never depends on drag-and-drop (WCAG 2.1.1). Rejected files
   are announced through `notify`, not just tinted red (WCAG 1.4.1).
   ===================================================================== */

import React, { useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { Dropzone, type DropzoneProps } from '@mantine/dropzone';

import { IconFile, IconPlus, IconUpload, IconX } from './icons';
import { notify } from './notify';
import { uiText } from './i18n';

/** Bytes → a human size. Binary units, because that's what file managers show. */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export interface FileUploadProps
  extends Omit<DropzoneProps, 'onDrop' | 'children' | 'openRef'> {
  /**
   * Performs the upload. Report progress in 0..100 to drive the bar; resolve
   * to finish, reject to surface an error and keep the files staged.
   * Omit it for staging-only forms (the caller reads `onFilesChange` and
   * submits the files itself) — the Upload button is not rendered then.
   */
  onUpload?: (files: File[], onProgress: (percent: number) => void) => Promise<void>;
  /** Called whenever the staged selection changes. */
  onFilesChange?: (files: File[]) => void;
  /** Upload as soon as files are chosen, hiding the Upload/Cancel buttons. */
  auto?: boolean;
  chooseLabel?: string;
  uploadLabel?: string;
  cancelLabel?: string;
  /** Empty-state content for the drop area. */
  placeholder?: React.ReactNode;
  /** Show the drop area. Set false for the Prime shape: Choose opens the picker, no standing drop area. */
  showDropArea?: boolean;
}

export function FileUpload({
  onUpload,
  onFilesChange,
  auto = false,
  // Defaults re-evaluate per render, so they follow the app language.
  chooseLabel = uiText('upload.choose', 'Choose'),
  uploadLabel = uiText('upload.upload', 'Upload'),
  cancelLabel = uiText('upload.cancel', 'Cancel'),
  placeholder = uiText('upload.placeholder', 'Drag and drop files here, or use Choose.'),
  showDropArea = true,
  multiple = true,
  onReject: onRejectProp,
  ...dropzoneProps
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const openPicker = useRef<() => void>(null);

  const uploading = progress !== null;

  const runUpload = async (toUpload: File[]) => {
    if (!onUpload || toUpload.length === 0) return;

    setProgress(0);
    try {
      await onUpload(toUpload, setProgress);
      setFiles([]);
      onFilesChange?.([]);
      notify.success(uiText('upload.complete', 'Upload complete'));
    } catch (error) {
      notify.error(
        uiText('upload.failed', 'Upload failed'),
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setProgress(null);
    }
  };

  const handleDrop = (dropped: File[]) => {
    // `multiple` false must replace, not append — otherwise a second pick
    // silently stages two files for a single-file field.
    const next = multiple ? [...files, ...dropped] : dropped.slice(0, 1);
    setFiles(next);
    onFilesChange?.(next);
    if (auto) void runUpload(next);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange?.(next);
  };

  const clear = () => {
    setFiles([]);
    onFilesChange?.([]);
  };

  // Reject message keyed on the actual reason, not a blanket "too large":
  // @mantine/dropzone tags each error with a code (file-too-large /
  // file-invalid-type / …). Callers used to override onReject with a
  // size-only message that fired even for wrong file types (C-10).
  type Rejections = Parameters<NonNullable<DropzoneProps['onReject']>>[0];
  const rejectMessage = (r: Rejections[number]) => {
    const codes = r.errors.map((e) => e.code);
    if (codes.includes('file-too-large') && dropzoneProps.maxSize) {
      return `${r.file.name}: ${uiText('upload.tooLarge', 'File is too large (max {{size}})', {
        size: formatBytes(dropzoneProps.maxSize),
      })}`;
    }
    if (codes.includes('file-invalid-type')) {
      return `${r.file.name}: ${uiText('upload.invalidType', 'File type not allowed')}`;
    }
    return `${r.file.name}: ${r.errors.map((e) => e.message).join(', ')}`;
  };

  const handleReject = (rejections: Rejections) => {
    notify.error(
      uiText('upload.rejected', 'File rejected'),
      rejections.map(rejectMessage).join('\n')
    );
    onRejectProp?.(rejections);
  };

  return (
    <Box>
      {/* Compact action bar: the full Choose / Upload / Cancel trio has to fit
          one row inside the 400px viewer menu panel (the ThemeWizard upload
          step). At sm the three sat right on the fit boundary and the third
          wrapped to a second row; size="xs" shrinks height and font together
          (proportionate — reads as a compact bar, not shrunken text) and, with
          px="xs" + a tight icon gap (ads-btn-tight) + a tight between-button
          gap, fits them on one line with room to spare. They still wrap
          gracefully on a genuinely tiny screen. */}
      <Group className="ads-fileupload__toolbar" gap="6px" justify="center">
        <Button
          size="xs"
          px="xs"
          className="ads-btn-tight"
          leftSection={<IconPlus />}
          onClick={() => openPicker.current?.()}
          disabled={uploading}
        >
          {chooseLabel}
        </Button>

        {!auto && (
          <>
            {onUpload && (
              <Button
                size="xs"
                px="xs"
                className="ads-btn-tight"
                leftSection={<IconUpload />}
                color="success"
                onClick={() => void runUpload(files)}
                disabled={files.length === 0 || uploading}
                loading={uploading}
              >
                {uploadLabel}
              </Button>
            )}
            <Button
              size="xs"
              px="xs"
              className="ads-btn-tight"
              leftSection={<IconX />}
              color="danger"
              variant="outline"
              onClick={clear}
              disabled={files.length === 0 || uploading}
            >
              {cancelLabel}
            </Button>
          </>
        )}
      </Group>

      <Dropzone
        className="ads-fileupload__dropzone"
        openRef={openPicker}
        onDrop={handleDrop}
        onReject={handleReject}
        multiple={multiple}
        disabled={uploading}
        {...dropzoneProps}
        style={{
          ...(typeof dropzoneProps.style === 'object' ? dropzoneProps.style : {}),
          ...(showDropArea ? {} : { display: 'none' }),
        }}
      >
        <Text ta="center" py="md" c="dimmed" size="sm">
          {placeholder}
        </Text>
      </Dropzone>

      {uploading && (
        <Progress
          value={progress ?? 0}
          mt="xs"
          aria-label={`${uploadLabel}: ${Math.round(progress ?? 0)}%`}
        />
      )}

      {files.length > 0 && (
        <Stack gap="xs" mt="xs">
          {files.map((file, index) => (
            <Group key={`${file.name}-${file.lastModified}`} gap="xs" wrap="nowrap">
              <Box c="neutral.7" fz="lg" aria-hidden>
                <IconFile />
              </Box>
              <Text size="sm" style={{ flex: 1, minWidth: 0 }} truncate>
                {file.name}
              </Text>
              <Text size="sm" c="dimmed">
                {formatBytes(file.size)}
              </Text>
              <ActionIcon
                variant="subtle"
                color="danger"
                aria-label={`${uiText('upload.remove', 'Remove')} ${file.name}`}
                onClick={() => removeAt(index)}
                disabled={uploading}
              >
                <IconX />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
    </Box>
  );
}
