import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Plus } from "lucide-react";

interface AddStudentFormProps {
  onStudentAdded: () => void;
}

export const AddStudentForm = ({ onStudentAdded }: AddStudentFormProps) => {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a photo under 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a student name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      // Insert student into database
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          name: name.trim(),
          photo_url: photoUrl,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Student added",
        description: `${name} has been added successfully`,
      });

      // Reset form
      setName("");
      setPhoto(null);
      const fileInput = document.getElementById('photo-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onStudentAdded();
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Student
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo-input">Student Photo (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isLoading}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {photo && (
              <p className="text-sm text-muted-foreground">
                Selected: {photo.name}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Adding Student..." : "Add Student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};