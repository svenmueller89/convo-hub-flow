
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';

const AppearanceSettings: React.FC = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState('light');
  const [density, setDensity] = useState('comfortable');
  const [fontSize, setFontSize] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Appearance settings saved",
        description: "Your appearance preferences have been updated."
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Theme</h3>
        <div>
          <div className="space-y-1.5">
            <Label htmlFor="theme-options">Select a theme</Label>
            <ToggleGroup 
              id="theme-options"
              type="single" 
              variant="outline"
              value={theme}
              onValueChange={(value) => {
                if (value) setTheme(value);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="light">Light</ToggleGroupItem>
              <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
              <ToggleGroupItem value="system">System</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Density</h3>
        <div>
          <div className="space-y-1.5">
            <Label htmlFor="density-options">Display density</Label>
            <ToggleGroup 
              id="density-options"
              type="single" 
              variant="outline"
              value={density}
              onValueChange={(value) => {
                if (value) setDensity(value);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
              <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Font Size</h3>
        <div>
          <div className="space-y-1.5">
            <Label htmlFor="font-size-options">Text size</Label>
            <ToggleGroup 
              id="font-size-options"
              type="single" 
              variant="outline"
              value={fontSize}
              onValueChange={(value) => {
                if (value) setFontSize(value);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="small">Small</ToggleGroupItem>
              <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
              <ToggleGroupItem value="large">Large</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleSaveSettings} 
        disabled={isLoading}
        className="mt-6"
      >
        {isLoading ? "Saving..." : "Save Appearance Settings"}
      </Button>
    </div>
  );
};

export default AppearanceSettings;
