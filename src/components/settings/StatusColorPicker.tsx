
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorOption {
  value: string;
  name: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { value: '#3B82F6', name: 'Blue' },
  { value: '#10B981', name: 'Green' },
  { value: '#F59E0B', name: 'Yellow' },
  { value: '#EF4444', name: 'Red' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#6B7280', name: 'Gray' },
  { value: '#1F2937', name: 'Dark' },
  { value: '#64748B', name: 'Slate' },
  { value: '#F97316', name: 'Orange' },
];

interface StatusColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function StatusColorPicker({ value, onChange }: StatusColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex justify-between items-center gap-2"
        >
          <div className="flex gap-2 items-center">
            <div 
              className="h-4 w-4 rounded-full" 
              style={{ backgroundColor: value }}
            />
            <span>
              {COLOR_OPTIONS.find(c => c.value === value)?.name || 'Custom'}
            </span>
          </div>
          <span>Change</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2 p-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full cursor-pointer flex items-center justify-center border-2",
                value === color.value ? "border-black dark:border-white" : "border-transparent"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
