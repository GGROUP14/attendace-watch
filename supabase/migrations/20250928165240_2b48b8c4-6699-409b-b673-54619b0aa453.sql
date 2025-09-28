-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  is_present BOOLEAN NOT NULL DEFAULT false,
  has_permission BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a classroom system)
CREATE POLICY "Students are viewable by everyone" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Students can be inserted by everyone" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can be updated by everyone" 
ON public.students 
FOR UPDATE 
USING (true);

CREATE POLICY "Students can be deleted by everyone" 
ON public.students 
FOR DELETE 
USING (true);

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Create storage policies for student photos
CREATE POLICY "Student photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'student-photos');

CREATE POLICY "Anyone can upload student photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Anyone can update student photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'student-photos');

CREATE POLICY "Anyone can delete student photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'student-photos');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();