import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = './temp-downloads';
const supportedExtensions: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  audio: ['mp3', 'wav', 'aac', 'm4a', 'flac'],
  video: ['mp4', 'mkv', 'avi', 'mov', 'webm'],
};

export function getFileTypeFromUrl(url: string) {
  if (supportedExtensions.image.some((i) => url.includes(`.${i}`)))
    return 'image';
  if (supportedExtensions.audio.some((i) => url.includes(`.${i}`)))
    return 'audio';
  if (supportedExtensions.video.some((i) => url.includes(`.${i}`)))
    return 'video';
  return null;
}

export async function getFileTypeAndSize(
  url: string
): Promise<
  [Error | null, { fileType: string | null; fileSize: number | null }]
> {
  try {
    console.log('Fetching file metadata...', url);
    const response = await axios.head(url);

    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];

    const fileSize = contentLength ? parseInt(contentLength, 10) : null;

    let fileType: string | null = null;
    if (contentType.startsWith('audio/')) {
      fileType = 'audio';
    } else if (contentType.startsWith('video/')) {
      fileType = 'video';
    } else {
      throw new Error(`Unsupported file type: ${contentType}`);
    }

    return [null, { fileType, fileSize }];
  } catch (error: any) {
    return [
      new Error(`Failed to fetch file metadata: ${error.message}`),
      { fileType: null, fileSize: null },
    ];
  }
}

export const downloadImage = async (
  url: string,
  dir: string
): Promise<string> => {
  const fileName = path.basename(url.split('?')[0]);
  const dirPath = path.resolve(dir, TEMP_DIR);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  const filePath = path.resolve(dirPath, fileName);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return filePath;
};

export const downloadMedia = async (
  url: string,
  dir: string,
  type: 'image' | 'audio' | 'video'
): Promise<string | null> => {
  const fileName = path.basename(url.split('?')[0]);

  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  if (!supportedExtensions[type].includes(fileExtension)) {
    console.error(`Unsupported ${type} file type: .${fileExtension}`);
    return null;
  }

  const dirPath = path.resolve(dir, TEMP_DIR, type);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.resolve(dirPath, fileName);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return filePath;
};
