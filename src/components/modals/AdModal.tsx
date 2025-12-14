import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Youtube, ExternalLink, Building2 } from 'lucide-react';
import type { Advertisement } from '@/types';
import { advertisersApi } from '@/services/api';

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const adSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  media_type: z.enum(['image', 'youtube']),
  content_url: z.string().min(1, 'Content URL is required'),
  duration_seconds: z.number().min(1, 'Duration must be at least 1 second').max(60, 'Duration cannot exceed 60 seconds'),
  advertiser_id: z.number().min(1, 'Advertiser is required'),
});

type AdFormData = z.infer<typeof adSchema>;

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdFormData) => void;
  ad?: Advertisement | null;
  isLoading?: boolean;
}

const AdModal: React.FC<AdModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ad,
  isLoading,
}) => {
  const isEditing = !!ad;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [advertisers, setAdvertisers] = useState<Array<{ id: number; name: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: '',
      media_type: 'image',
      content_url: '',
      duration_seconds: 10,
      advertiser_id: 0,
    },
  });

  const watchedMediaType = watch('media_type');
  const watchedContentUrl = watch('content_url');

  // Reset form when modal opens/closes or ad changes
  useEffect(() => {
    if (isOpen) {
      // load advertisers for dropdown
      advertisersApi.getAdvertisers()
        .then((res) => {
          const data = (res as any).data ?? res;
          setAdvertisers(Array.isArray(data) ? data : []);
        })
        .catch(() => setAdvertisers([]));

      if (ad) {
        reset({
          title: ad.title,
          media_type: ad.media_type,
          content_url: ad.content_url,
          duration_seconds: ad.duration_seconds,
          advertiser_id: ad.advertiser?.id ?? 0,
        });
      } else {
        reset({
          title: '',
          media_type: 'image',
          content_url: '',
          duration_seconds: 10,
          advertiser_id: 0,
        });
      }
    }
  }, [isOpen, ad, reset]);

  // Update preview when URL changes
  useEffect(() => {
    if (watchedMediaType === 'youtube') {
      const videoId = getYouTubeVideoId(watchedContentUrl);
      if (videoId) {
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(watchedContentUrl || null);
    }
  }, [watchedContentUrl, watchedMediaType]);

  // Auto-set duration for YouTube videos
  useEffect(() => {
    if (watchedMediaType === 'youtube') {
      setValue('duration_seconds', 30); // Default 30s for YouTube
    }
  }, [watchedMediaType, setValue]);

  const handleFormSubmit = (data: AdFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Advertisement' : 'Add New Advertisement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Ad Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Jazz 4G Promotion"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Media Type */}
          <div className="space-y-2">
            <Label>Media Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('media_type', 'image')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  watchedMediaType === 'image'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image className={`h-8 w-8 ${watchedMediaType === 'image' ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${watchedMediaType === 'image' ? 'text-purple-700' : 'text-gray-600'}`}>
                  Image
                </span>
              </button>
              <button
                type="button"
                onClick={() => setValue('media_type', 'youtube')}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  watchedMediaType === 'youtube'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Youtube className={`h-8 w-8 ${watchedMediaType === 'youtube' ? 'text-red-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${watchedMediaType === 'youtube' ? 'text-red-700' : 'text-gray-600'}`}>
                  YouTube Video
                </span>
              </button>
            </div>
          </div>

          {/* Content URL */}
          <div className="space-y-2">
            <Label htmlFor="content_url">
              {watchedMediaType === 'youtube' ? 'YouTube URL *' : 'Image URL *'}
            </Label>
            <Input
              id="content_url"
              placeholder={
                watchedMediaType === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://example.com/image.jpg'
              }
              {...register('content_url')}
            />
            {errors.content_url && (
              <p className="text-sm text-red-500">{errors.content_url.message}</p>
            )}
            {watchedMediaType === 'youtube' && (
              <p className="text-xs text-muted-foreground">
                Supports youtube.com/watch, youtu.be, and embed URLs
              </p>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {watchedMediaType === 'youtube' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-red-600 rounded-full p-3">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              {watchedMediaType === 'youtube' && watchedContentUrl && (
                <a
                  href={watchedContentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in YouTube
                </a>
              )}
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_seconds">Duration (seconds) *</Label>
            <Input
              id="duration_seconds"
              type="number"
              min={1}
              max={60}
              {...register('duration_seconds', { valueAsNumber: true })}
            />
            {errors.duration_seconds && (
              <p className="text-sm text-red-500">{errors.duration_seconds.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {watchedMediaType === 'youtube'
                ? 'Recommended: 15-30 seconds for video ads'
                : 'Recommended: 8-15 seconds for image ads'}
            </p>
          </div>

          {/* Advertiser Details Section */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Advertiser Details
            </h4>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="advertiser_id">Select Advertiser *</Label>
                <div className="flex items-center gap-2">
                  <select id="advertiser_id" className="flex-1 p-2 border rounded" {...register('advertiser_id', { valueAsNumber: true })}>
                    <option value={0}>Select Advertiser</option>
                    {advertisers.map((adv) => (
                      <option key={adv.id} value={adv.id}>{adv.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-2 bg-green-600 text-white rounded"
                    onClick={async () => {
                      const name = window.prompt('Advertiser name');
                      if (!name) return;
                      const phone = window.prompt('Contact phone (optional)') || '';
                      const email = window.prompt('Contact email (optional)') || '';
                      try {
                        const res = await advertisersApi.createAdvertiser({ advertiser_name: name, contact_phone: phone || undefined, contact_email: email || undefined });
                        const created = (res as any).data ?? res;
                        // refresh advertisers list
                        const listRes = await advertisersApi.getAdvertisers();
                        const list = (listRes as any).data ?? listRes;
                        setAdvertisers(Array.isArray(list) ? list : []);
                        // set newly created advertiser
                        if (created && created.id) {
                          setValue('advertiser_id', created.id);
                        }
                      } catch (e) {
                        // ignore - quick flow
                      }
                    }}
                    title="Create new advertiser"
                  >
                    +
                  </button>
                </div>
                {errors.advertiser_id && (
                  <p className="text-sm text-red-500">{errors.advertiser_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <p className="text-sm text-muted-foreground">Select an advertiser to view contact details in the advertiser management page.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Ad' : 'Add Ad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdModal;
