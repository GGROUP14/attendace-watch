DROP POLICY IF EXISTS "Students are viewable by everyone" ON public.students;
DROP POLICY IF EXISTS "Students can be deleted by everyone" ON public.students;
DROP POLICY IF EXISTS "Students can be inserted by everyone" ON public.students;
DROP POLICY IF EXISTS "Students can be updated by everyone" ON public.students;

CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE TO authenticated USING (true);

-- Restrict storage bucket to authenticated users for writes; keep public read since photo_url is used directly
CREATE POLICY "Authenticated can upload student photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Authenticated can update student photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-photos');
CREATE POLICY "Authenticated can delete student photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'student-photos');