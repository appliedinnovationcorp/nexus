import sharp from 'sharp';

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface TransformOptions {
  resize?: ResizeOptions;
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';
  quality?: number;
  progressive?: boolean;
  optimize?: boolean;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  watermark?: {
    image: Buffer;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

export interface ThumbnailPreset {
  name: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
}

export const DEFAULT_THUMBNAIL_PRESETS: ThumbnailPreset[] = [
  { name: 'thumbnail', width: 150, height: 150, format: 'webp', quality: 80 },
  { name: 'small', width: 300, height: 300, format: 'webp', quality: 85 },
  { name: 'medium', width: 600, height: 600, format: 'webp', quality: 85 },
  { name: 'large', width: 1200, height: 1200, format: 'webp', quality: 90 },
];

export class ImageTransformer {
  async transform(buffer: Buffer, options: TransformOptions): Promise<Buffer> {
    let image = sharp(buffer);

    // Get original image metadata
    const metadata = await image.metadata();

    // Apply resize
    if (options.resize) {
      image = image.resize({
        width: options.resize.width,
        height: options.resize.height,
        fit: options.resize.fit || 'cover',
        position: options.resize.position || 'center',
        withoutEnlargement: true,
      });
    }

    // Apply rotation
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    // Apply flip/flop
    if (options.flip) {
      image = image.flip();
    }
    if (options.flop) {
      image = image.flop();
    }

    // Apply blur
    if (options.blur && options.blur > 0) {
      image = image.blur(Math.min(options.blur, 1000));
    }

    // Apply sharpen
    if (options.sharpen) {
      image = image.sharpen();
    }

    // Apply grayscale
    if (options.grayscale) {
      image = image.grayscale();
    }

    // Apply watermark
    if (options.watermark) {
      const watermarkImage = await this.prepareWatermark(
        options.watermark.image,
        metadata.width || 800,
        metadata.height || 600,
        options.watermark.opacity || 0.5
      );

      const position = this.getWatermarkPosition(
        options.watermark.position,
        metadata.width || 800,
        metadata.height || 600
      );

      image = image.composite([{
        input: watermarkImage,
        ...position,
        blend: 'over',
      }]);
    }

    // Apply format and quality
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          image = image.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive || false,
            mozjpeg: options.optimize || false,
          });
          break;
        case 'png':
          image = image.png({
            quality: options.quality || 90,
            progressive: options.progressive || false,
            compressionLevel: options.optimize ? 9 : 6,
          });
          break;
        case 'webp':
          image = image.webp({
            quality: options.quality || 85,
            effort: options.optimize ? 6 : 4,
          });
          break;
        case 'avif':
          image = image.avif({
            quality: options.quality || 85,
            effort: options.optimize ? 9 : 4,
          });
          break;
        case 'tiff':
          image = image.tiff({
            quality: options.quality || 85,
            compression: 'lzw',
          });
          break;
      }
    }

    return image.toBuffer();
  }

  async generateThumbnails(
    buffer: Buffer, 
    presets: ThumbnailPreset[] = DEFAULT_THUMBNAIL_PRESETS
  ): Promise<{ [key: string]: Buffer }> {
    const thumbnails: { [key: string]: Buffer } = {};

    for (const preset of presets) {
      const thumbnail = await this.transform(buffer, {
        resize: {
          width: preset.width,
          height: preset.height,
          fit: 'cover',
        },
        format: preset.format,
        quality: preset.quality,
        optimize: true,
      });

      thumbnails[preset.name] = thumbnail;
    }

    return thumbnails;
  }

  async optimizeImage(buffer: Buffer, targetFormat?: 'jpeg' | 'webp' | 'avif'): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const originalFormat = metadata.format;

    // Determine best format
    let format: 'jpeg' | 'webp' | 'avif' = targetFormat || 'webp';
    
    // Use AVIF for better compression if supported
    if (!targetFormat && this.supportsAvif()) {
      format = 'avif';
    }

    const options: TransformOptions = {
      format,
      quality: this.getOptimalQuality(format),
      optimize: true,
      progressive: format === 'jpeg',
    };

    // Auto-resize if image is too large
    if (metadata.width && metadata.width > 2048) {
      options.resize = {
        width: 2048,
        height: 2048,
        fit: 'inside',
      };
    }

    return this.transform(buffer, options);
  }

  async getImageInfo(buffer: Buffer): Promise<{
    format: string;
    width: number;
    height: number;
    channels: number;
    density: number;
    hasAlpha: boolean;
    size: number;
  }> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      channels: metadata.channels || 0,
      density: metadata.density || 72,
      hasAlpha: metadata.hasAlpha || false,
      size: buffer.length,
    };
  }

  async createResponsiveImages(
    buffer: Buffer,
    widths: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): Promise<{ [key: string]: Buffer }> {
    const images: { [key: string]: Buffer } = {};

    for (const width of widths) {
      const resized = await this.transform(buffer, {
        resize: {
          width,
          fit: 'inside',
        },
        format: 'webp',
        quality: 85,
        optimize: true,
      });

      images[`${width}w`] = resized;
    }

    return images;
  }

  private async prepareWatermark(
    watermarkBuffer: Buffer,
    imageWidth: number,
    imageHeight: number,
    opacity: number
  ): Promise<Buffer> {
    const maxSize = Math.min(imageWidth, imageHeight) * 0.2; // 20% of image size
    
    return sharp(watermarkBuffer)
      .resize(maxSize, maxSize, { fit: 'inside' })
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(255 * (1 - opacity))]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      }])
      .png()
      .toBuffer();
  }

  private getWatermarkPosition(
    position: string,
    imageWidth: number,
    imageHeight: number
  ): { top?: number; left?: number } {
    const margin = 20;

    switch (position) {
      case 'top-left':
        return { top: margin, left: margin };
      case 'top-right':
        return { top: margin, left: imageWidth - margin };
      case 'bottom-left':
        return { top: imageHeight - margin, left: margin };
      case 'bottom-right':
        return { top: imageHeight - margin, left: imageWidth - margin };
      case 'center':
      default:
        return { 
          top: Math.round(imageHeight / 2), 
          left: Math.round(imageWidth / 2) 
        };
    }
  }

  private getOptimalQuality(format: string): number {
    switch (format) {
      case 'jpeg':
        return 85;
      case 'webp':
        return 80;
      case 'avif':
        return 75;
      default:
        return 85;
    }
  }

  private supportsAvif(): boolean {
    // Check if AVIF is supported (this would be more sophisticated in a real implementation)
    return true; // Assume support for now
  }

  async convertFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    quality?: number
  ): Promise<Buffer> {
    return this.transform(buffer, {
      format: targetFormat,
      quality: quality || this.getOptimalQuality(targetFormat),
      optimize: true,
    });
  }

  async stripMetadata(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .withMetadata({})
      .toBuffer();
  }
}

// Singleton instance
let imageTransformerInstance: ImageTransformer | null = null;

export function getImageTransformer(): ImageTransformer {
  if (!imageTransformerInstance) {
    imageTransformerInstance = new ImageTransformer();
  }
  return imageTransformerInstance;
}
