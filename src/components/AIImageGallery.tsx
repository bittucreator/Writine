'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Loader2,
  ImageIcon,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface AIImage {
  id: string;
  section: string;
  prompt: string;
  url: string;
}

interface AIImageGalleryProps {
  images: AIImage[];
  onImagesChange: (images: AIImage[]) => void;
  onInsertImage: (url: string) => void;
  disabled?: boolean;
}

export default function AIImageGallery({
  images,
  onImagesChange,
  onInsertImage,
  disabled = false,
}: AIImageGalleryProps) {
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const regenerateImage = async (image: AIImage, newPrompt?: string) => {
    setRegeneratingId(image.id);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt || image.prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        const updatedImages = images.map(img =>
          img.id === image.id
            ? { ...img, url: data.imageUrl, prompt: newPrompt || img.prompt }
            : img
        );
        onImagesChange(updatedImages);
        toast.success('Image regenerated!');
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast.error('Failed to regenerate image');
    } finally {
      setRegeneratingId(null);
      setEditingId(null);
      setEditPrompt('');
    }
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onImagesChange(updatedImages);
    toast.success('Image removed');
  };

  const addNewImage = async () => {
    if (!newPrompt.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        const newImage: AIImage = {
          id: `ai-${Date.now()}`,
          section: 'Custom',
          prompt: newPrompt,
          url: data.imageUrl,
        };
        onImagesChange([...images, newImage]);
        setNewPrompt('');
        setShowAddDialog(false);
        toast.success('Image generated!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const startEditing = (image: AIImage) => {
    setEditingId(image.id);
    setEditPrompt(image.prompt);
  };

  if (images.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
        <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-3">No AI-generated images yet</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Generate Image
        </Button>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8345dd]" />
                Generate AI Image
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8345dd] focus:border-transparent resize-none"
                disabled={generating}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={generating}>
                  Cancel
                </Button>
                <Button
                  onClick={addNewImage}
                  disabled={!newPrompt.trim() || generating}
                  className="bg-[#8345dd] hover:bg-[#7b77e0]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8345dd]" />
          AI Generated Images ({images.length})
        </h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
          className="gap-1.5 text-xs h-7"
        >
          <Plus className="w-3.5 h-3.5" />
          Add More
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <div className="relative aspect-video bg-slate-100">
              {regeneratingId === image.id ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <Loader2 className="w-8 h-8 text-[#8345dd] animate-spin" />
                </div>
              ) : (
                <Image
                  src={image.url}
                  alt={image.section}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onInsertImage(image.url)}
                  disabled={disabled || regeneratingId === image.id}
                  className="h-8 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Insert
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEditing(image)}
                  disabled={disabled || regeneratingId === image.id}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => regenerateImage(image)}
                  disabled={disabled || regeneratingId === image.id}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(image.id)}
                  disabled={disabled || regeneratingId === image.id}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-xs font-medium text-slate-600 mb-1">{image.section}</p>
              <p className="text-[10px] text-slate-400 line-clamp-2">{image.prompt}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Prompt Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#8345dd]" />
              Edit & Regenerate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Edit the image prompt..."
              className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8345dd] focus:border-transparent resize-none"
              disabled={regeneratingId !== null}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingId(null)} disabled={regeneratingId !== null}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const image = images.find(img => img.id === editingId);
                  if (image) regenerateImage(image, editPrompt);
                }}
                disabled={!editPrompt.trim() || regeneratingId !== null}
                className="bg-[#8345dd] hover:bg-[#7b77e0]"
              >
                {regeneratingId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Image Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#8345dd]" />
              Generate AI Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8345dd] focus:border-transparent resize-none"
              disabled={generating}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={generating}>
                Cancel
              </Button>
              <Button
                onClick={addNewImage}
                disabled={!newPrompt.trim() || generating}
                className="bg-[#8345dd] hover:bg-[#7b77e0]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
