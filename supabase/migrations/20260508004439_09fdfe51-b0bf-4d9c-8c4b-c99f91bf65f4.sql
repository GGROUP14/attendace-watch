
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Public can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update students" ON public.students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete students" ON public.students FOR DELETE USING (true);
