import { Upload } from 'lucide-react';
import { useId } from 'react';

// Single shared file picker matching the site design (ghost button + filename).
// Visuals only: single-file contract by default; multiple=true switches to array contract.
// Single-file behavior is unchanged.
export default function FileField({ accept, value, onChange, multiple = false }) {
  const id = useId();
  const count = multiple ? (Array.isArray(value) ? value.length : 0) : 0;
  const label = multiple
    ? (count > 0 ? count + ' فایل انتخاب شد' : 'فایلی انتخاب نشده است')
    : (value?.name || 'فایلی انتخاب نشده است');
  return (
    <div className="flex items-center gap-2 min-w-0">
      <input
        id={id}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        key={multiple ? 'multi-' + count : (value ? 'chosen' : 'empty')}
        onChange={(e) => onChange(multiple ? Array.from(e.target.files || []) : (e.target.files?.[0] || null))}
      />
      <label htmlFor={id} className="btn-ghost !min-h-0 !py-2 !px-4 text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0">
        <Upload size={14} /> انتخاب فایل
      </label>
      <span className="mut text-xs truncate">{label}</span>
    </div>
  );
}
