'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  isOwner: boolean;
  type?: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
  className?: string;
  children: ReactNode;
}

export function InlineEdit({
  value,
  onSave,
  isOwner,
  type = 'text',
  placeholder = 'Enter text...',
  maxLength,
  className = '',
  children,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleEdit = () => {
    if (!isOwner) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type === 'text') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOwner) {
    return <>{children}</>;
  }

  if (isEditing) {
    return (
      <div className={`inline-flex items-start gap-2 ${className}`}>
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            className="flex-1 px-3 py-2 rounded-lg border border-go bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            className="flex-1 px-3 py-1.5 rounded-lg border border-go bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go"
          />
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="p-1.5 bg-go text-[#00301E] rounded-lg hover:bg-[#04B76B] disabled:opacity-50 transition-colors"
            title="Save"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1.5 border border-rule rounded-lg hover:bg-soft disabled:opacity-50 transition-colors"
            title="Cancel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <button
        type="button"
        onClick={handleEdit}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all ${
          isHovered ? 'opacity-100 bg-soft' : 'opacity-0'
        } hover:bg-rule`}
        title="Edit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}

// Wrapper for sections with edit capability
interface InlineEditSectionProps {
  fields: {
    key: string;
    label: string;
    value: string;
    type?: 'text' | 'textarea';
    placeholder?: string;
    maxLength?: number;
  }[];
  onSave: (key: string, value: string) => Promise<void>;
  isOwner: boolean;
  className?: string;
}

export function InlineEditSection({
  fields,
  onSave,
  isOwner,
  className = '',
}: InlineEditSectionProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (key: string, currentValue: string) => {
    setEditValues({ ...editValues, [key]: currentValue });
    setEditingKey(key);
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  const handleSave = async (key: string) => {
    const field = fields.find((f) => f.key === key);
    if (!field) return;

    const newValue = editValues[key] ?? field.value;
    if (newValue === field.value) {
      setEditingKey(null);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(key, newValue);
      setEditingKey(null);
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className={className}>
      {fields.map((field) => {
        const isEditing = editingKey === field.key;
        const currentValue = isEditing ? (editValues[field.key] ?? field.value) : field.value;

        return (
          <div key={field.key} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-[12px] tracking-[0.1em] uppercase text-ink-3 font-bold">
                {field.label}
              </h4>
              {isOwner && !isEditing && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(field.key, field.value)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-soft transition-all"
                  title="Edit"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-start gap-2">
                {field.type === 'textarea' ? (
                  <textarea
                    value={currentValue}
                    onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    rows={3}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg border border-go bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    autoFocus
                    className="flex-1 px-3 py-1.5 rounded-lg border border-go bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go"
                  />
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleSave(field.key)}
                    disabled={isSaving}
                    className="p-1.5 bg-go text-[#00301E] rounded-lg hover:bg-[#04B76B] disabled:opacity-50 transition-colors"
                    title="Save"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-1.5 border border-rule rounded-lg hover:bg-soft disabled:opacity-50 transition-colors"
                    title="Cancel"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-ink-2">
                {field.value || (
                  <span className="text-ink-3 italic">
                    {isOwner ? `Click to add ${field.label.toLowerCase()}` : 'Not provided'}
                  </span>
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
