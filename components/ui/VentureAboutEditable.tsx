'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VentureAboutEditableProps {
  ventureId: string;
  ventureName: string;
  problem: string | null;
  who: string | null;
  why: string | null;
  isOwner: boolean;
}

export function VentureAboutEditable({
  ventureId,
  ventureName,
  problem,
  who,
  why,
  isOwner,
}: VentureAboutEditableProps) {
  const router = useRouter();
  const [editingField, setEditingField] = useState<'problem' | 'who' | 'why' | null>(null);
  const [values, setValues] = useState({
    problem: problem || '',
    who: who || '',
    why: why || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (field: 'problem' | 'who' | 'why') => {
    setIsSaving(true);
    try {
      await fetch(`/api/ventures/${ventureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: values[field] }),
      });
      setEditingField(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setIsSaving(false);
  };

  const handleCancel = (field: 'problem' | 'who' | 'why') => {
    setValues({
      ...values,
      [field]: field === 'problem' ? (problem || '') : field === 'who' ? (who || '') : (why || ''),
    });
    setEditingField(null);
  };

  // If no content and not owner, don't render
  if (!isOwner && !problem && !who && !why) {
    return null;
  }

  const renderField = (
    field: 'problem' | 'who' | 'why',
    label: string,
    currentValue: string | null
  ) => {
    const isEditing = editingField === field;
    const displayValue = currentValue || '';

    return (
      <div key={field} className="group">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[12px] tracking-[0.1em] uppercase text-ink-3 font-bold">
            {label}
          </h4>
          {isOwner && !isEditing && (
            <button
              type="button"
              onClick={() => setEditingField(field)}
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
            <textarea
              value={values[field]}
              onChange={(e) => setValues({ ...values, [field]: e.target.value })}
              placeholder={`Add ${label.toLowerCase()}...`}
              rows={3}
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg border border-go bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go resize-none"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSave(field)}
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
                onClick={() => handleCancel(field)}
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
            {displayValue || (
              isOwner ? (
                <button
                  type="button"
                  onClick={() => setEditingField(field)}
                  className="text-ink-3 italic hover:text-ink-2 transition-colors"
                >
                  Click to add {label.toLowerCase()}
                </button>
              ) : null
            )}
          </p>
        )}
      </div>
    );
  };

  // Check if there's any content or if owner can edit
  const hasContent = problem || who || why;
  if (!hasContent && !isOwner) return null;

  return (
    <details className="mb-8 group" open>
      <summary className="cursor-pointer list-none flex items-center gap-2 text-[14px] font-semibold text-ink-2 hover:text-ink">
        <span className="transition-transform group-open:rotate-90">▶</span>
        About {ventureName}
      </summary>
      <div className="mt-4 pl-5 border-l-2 border-rule space-y-4">
        {(problem || isOwner) && renderField('problem', 'The problem', problem)}
        {(who || isOwner) && renderField('who', "Who it's for", who)}
        {(why || isOwner) && renderField('why', 'Why them', why)}
      </div>
    </details>
  );
}
