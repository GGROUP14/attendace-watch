import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddStudentFormProps {
  onStudentAdded: () => void;
}

export const AddStudentForm = ({ onStudentAdded }: AddStudentFormProps) => {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a student name");
      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      }

      // Insert student into database
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          name: name.trim(),
          photo_url: photoUrl
        });

      if (insertError) {
        throw insertError;
      }

      toast.success("Student added successfully!");
      setName("");
      setPhoto(null);
      // Reset file input
      const fileInput = document.getElementById('photo-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onStudentAdded();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error("Failed to add student");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Student</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student name"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="photo-input">Student Photo</Label>
            <Input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};