'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Code,
  Minus,
  X,
  Check,
  Type,
  Table as TableIcon,
  ListChecks,
  Sparkles,
  Pilcrow,
  Strikethrough,
  SquareCode,
  Upload,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const lowlight = createLowlight(common);

interface BlogEditorProProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

const COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E',
];

const HIGHLIGHT_COLORS = [
  '#FEF08A', '#FED7AA', '#FECACA', '#BBF7D0', '#A5F3FC', '#DDD6FE', '#FBCFE8',
];

const SLASH_COMMANDS = [
  { id: 'heading1', label: 'Heading 1', Icon: Heading1, description: 'Big section heading' },
  { id: 'heading2', label: 'Heading 2', Icon: Heading2, description: 'Medium section heading' },
  { id: 'heading3', label: 'Heading 3', Icon: Heading3, description: 'Small section heading' },
  { id: 'paragraph', label: 'Paragraph', Icon: Pilcrow, description: 'Plain text paragraph' },
  { id: 'bulletList', label: 'Bullet List', Icon: List, description: 'Create a bullet list' },
  { id: 'orderedList', label: 'Numbered List', Icon: ListOrdered, description: 'Create a numbered list' },
  { id: 'taskList', label: 'Task List', Icon: ListChecks, description: 'Create a todo checklist' },
  { id: 'blockquote', label: 'Quote', Icon: Quote, description: 'Capture a quote' },
  { id: 'codeBlock', label: 'Code Block', Icon: Code, description: 'Insert code snippet' },
  { id: 'horizontalRule', label: 'Divider', Icon: Minus, description: 'Visual divider line' },
  { id: 'table', label: 'Table', Icon: TableIcon, description: 'Insert a table' },
  { id: 'image', label: 'Image', Icon: ImageIcon, description: 'Insert an image' },
  { id: 'youtube', label: 'YouTube Video', Icon: YoutubeIcon, description: 'Embed a YouTube video' },
];

const ToolbarButton = ({ onClick, active, disabled, children, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      disabled
        ? 'opacity-30 cursor-not-allowed'
        : active
        ? 'bg-[#918df6] text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-px h-6 bg-slate-200 mx-1" />;

export default function BlogEditorPro({ content, onChange, placeholder }: BlogEditorProProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Filter slash commands based on search
  const filteredSlashCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Type "/" for commands, or start writing...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:top-6 before:left-8 before:text-slate-400 before:opacity-50 before-pointer-events-none',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-6 shadow-sm border',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#918df6] underline decoration-[#918df6]/30 hover:decoration-[#918df6] transition-colors',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl my-6 shadow-sm',
        },
        width: 640,
        height: 360,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-0',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 my-1',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-6',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-slate-100 bg-slate-50 px-4 py-2 text-left font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-100 px-4 py-2',
        },
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-slate-900 text-slate-50 rounded-xl p-4 my-6 overflow-x-auto text-sm font-mono',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      // Handle slash command detection
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
      const lastSlashIndex = textBefore.lastIndexOf('/');
      
      if (lastSlashIndex !== -1 && !textBefore.slice(lastSlashIndex).includes(' ')) {
        const filter = textBefore.slice(lastSlashIndex + 1);
        setSlashFilter(filter);
        setSelectedSlashIndex(0);
        
        // Get caret position for menu
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setSlashMenuPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  const executeSlashCommand = useCallback((commandId: string) => {
    if (!editor) return;
    
    // Delete the slash and filter text
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
    const slashIndex = textBefore.lastIndexOf('/');
    if (slashIndex !== -1) {
      const deleteFrom = from - (textBefore.length - slashIndex);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
    
    switch (commandId) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'image':
        setShowImageInput(true);
        break;
      case 'youtube':
        setShowVideoInput(true);
        break;
    }
    
    setShowSlashMenu(false);
    setSlashFilter('');
    setSelectedSlashIndex(0);
  }, [editor]);

  // Handle keyboard navigation for slash menu
  useEffect(() => {
    if (!showSlashMenu) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSlashIndex(prev => 
          prev < filteredSlashCommands.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSlashIndex(prev => 
          prev > 0 ? prev - 1 : filteredSlashCommands.length - 1
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredSlashCommands.length > 0) {
          executeSlashCommand(filteredSlashCommands[selectedSlashIndex].id);
        }
      } else if (event.key === 'Escape') {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSlashMenu, filteredSlashCommands, selectedSlashIndex, executeSlashCommand]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
      setShowSlashMenu(false);
    }
  }, [editor, imageUrl]);

  const addVideo = useCallback(() => {
    if (videoUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
      setVideoUrl('');
      setShowVideoInput(false);
      setShowSlashMenu(false);
    }
  }, [editor, videoUrl]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      setShowImageInput(false);
      setShowSlashMenu(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }, [editor]);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `blog-videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Insert video as HTML since TipTap doesn't have native video support
      editor.chain().focus().insertContent(
        `<video controls class="rounded-xl max-w-full h-auto my-6 shadow-sm border"><source src="${publicUrl}" type="${file.type}"></video>`
      ).run();
      setShowVideoInput(false);
      setShowSlashMenu(false);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video. Please try again.');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white animate-pulse">
        <div className="h-14 bg-slate-100" />
        <div className="h-125 bg-slate-50" />
      </div>
    );
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm relative">
      {/* Slash Command Menu */}
      {showSlashMenu && filteredSlashCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="absolute z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-72 max-h-80 overflow-y-auto"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
            <Sparkles className="w-3 h-3 inline mr-1.5" />
            Commands
          </div>
          {filteredSlashCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => executeSlashCommand(cmd.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedSlashIndex 
                  ? 'bg-[#918df6]/10 text-[#918df6]' 
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                index === selectedSlashIndex ? 'bg-[#918df6] text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <cmd.Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-sm">{cmd.label}</div>
                <div className="text-xs text-slate-400">{cmd.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white p-2">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive('taskList')}
            title="Task List"
          >
            <ListChecks className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <SquareCode className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            active={editor.isActive('table')}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Color */}
          <div className="relative">
            <ToolbarButton
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              active={showColorPicker}
              title="Text Color"
            >
              <Type className="w-4 h-4" />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-100 z-10">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-slate-100 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative">
            <ToolbarButton
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              active={showHighlightPicker || editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-100 z-10">
                <div className="grid grid-cols-7 gap-1">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-slate-100 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Link */}
          <div className="relative">
            <ToolbarButton
              onClick={() => {
                if (editor.isActive('link')) {
                  removeLink();
                } else {
                  setShowLinkInput(!showLinkInput);
                }
              }}
              active={editor.isActive('link') || showLinkInput}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            {showLinkInput && (
              <div className="absolute top-full right-0 mt-1 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-72">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  />
                  <Button size="sm" onClick={addLink} className="h-8 w-8 p-0 bg-[#918df6] hover:bg-[#7b77e0]">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowLinkInput(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowImageInput(!showImageInput)}
              active={showImageInput}
              title="Image"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            {showImageInput && (
              <div className="absolute top-full right-0 mt-1 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-72">
                <div className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    placeholder="Image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  />
                  <Button size="sm" onClick={addImage} className="h-8 w-8 p-0 bg-[#918df6] hover:bg-[#7b77e0]">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowImageInput(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full h-8 text-xs"
                >
                  {uploadingImage ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Image</>
                  )}
                </Button>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">Max 5MB • JPG, PNG, GIF, WebP</p>
              </div>
            )}
          </div>

          {/* YouTube / Video */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowVideoInput(!showVideoInput)}
              active={showVideoInput}
              title="Video"
            >
              <YoutubeIcon className="w-4 h-4" />
            </ToolbarButton>
            {showVideoInput && (
              <div className="absolute top-full right-0 mt-1 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-72">
                <div className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    placeholder="YouTube URL..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                  />
                  <Button size="sm" onClick={addVideo} className="h-8 w-8 p-0 bg-[#918df6] hover:bg-[#7b77e0]">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowVideoInput(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="w-full h-8 text-xs"
                >
                  {uploadingVideo ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Video</>
                  )}
                </Button>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">Max 50MB • MP4, WebM, MOV</p>
              </div>
            )}
          </div>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Type <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">/</kbd> for commands
        </span>
        <span>
          {content.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </div>
  );
}
