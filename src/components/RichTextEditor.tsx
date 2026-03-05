import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, IconButton, Tooltip, Typography, Divider } from '@mui/material';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label }) => {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. language switch)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: 2,
        overflow: 'hidden',
        '&:hover': { borderColor: 'grey.600' },
        '&:focus-within': {
          borderColor: 'secondary.main',
          borderWidth: 2,
          margin: '-1px',
        },
      }}
    >
      {label && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 1.5, pt: 1, display: 'block' }}
        >
          {label}
        </Typography>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5 }}>
        <Tooltip title={t('richEditor.bold')}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
          >
            <Bold size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('richEditor.italic')}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
          >
            <Italic size={18} />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title={t('richEditor.bulletList')}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
          >
            <List size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('richEditor.orderedList')}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
          >
            <ListOrdered size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Editor */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          minHeight: 150,
          '& .tiptap': {
            outline: 'none',
            minHeight: 150,
            '& p': { margin: '0 0 0.5em 0' },
            '& ul, & ol': {
              paddingLeft: '1.5em',
              margin: '0 0 0.5em 0',
            },
            '& li': { marginBottom: '0.25em' },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default RichTextEditor;
