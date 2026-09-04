import { Upload } from 'lucide-react';
import { useId } from 'react';

// Single shared file picker matching the site design (ghost button + filename).
// Visuals only: same single-file onChange contract as a native input.
export default function FileField({ accept, value, onChange }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <input
        id={id}
        type="file"
        className="hidden"
        accept={accept}
        key={value ? 'chosen' : 'empty'}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <label htmlFor={id} className="btn-ghost !min-h-0 !py-2 !px-4 text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0">
        <Upload size={14} /> انتخاب فایل
      </label>
      <span className="mut text-xs truncate">{value?.name || 'فایلی انتخاب نشده است'}</span>
    </div>
  );
}
