import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder = 'Type a tag and press Enter...', className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim().replace(/,/g, '');
    if (!trimmed) return;
    
    // Validations: max 10 tags, max 30 chars per tag, no duplicates
    if (value.length >= 10) return;
    if (trimmed.length > 30) return;
    if (value.includes(trimmed)) {
      setInputValue('');
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <div className="flex flex-wrap gap-2 mb-1">
        {value.map((tag) => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 bg-brand-accent/20 text-brand-accent text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-brand-accent/80 hover:text-brand-accent focus:outline-none"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length >= 10 ? 'Maximum 10 tags reached' : placeholder}
        disabled={value.length >= 10}
        className="border-brand-muted/30 focus:ring-brand-accent bg-brand-bg text-brand-text"
      />
      <div className="text-xs text-brand-muted/70">
        {value.length}/10 tags (max 30 characters each)
      </div>
    </div>
  );
}
