-- Fix 1: Make meeting-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'meeting-files';

-- Fix 2: Drop the overly permissive storage policy if it exists
DROP POLICY IF EXISTS "Anyone can view meeting files" ON storage.objects;

-- Fix 3: Create proper storage policies that verify meeting participation
-- Files should be organized as {meetingId}/{userId}/{filename}
DROP POLICY IF EXISTS "Participants can view storage files" ON storage.objects;
CREATE POLICY "Participants can view storage files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meeting-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT meeting_id::text FROM public.meeting_participants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can upload storage files" ON storage.objects;
CREATE POLICY "Participants can upload storage files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT meeting_id::text FROM public.meeting_participants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own storage files" ON storage.objects;
CREATE POLICY "Users can delete own storage files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-files'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Fix 4: Restrict profiles table - only allow viewing profiles of users in shared meetings
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile and meeting participants profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR user_id IN (
    SELECT DISTINCT mp2.user_id 
    FROM public.meeting_participants mp1
    JOIN public.meeting_participants mp2 ON mp1.meeting_id = mp2.meeting_id
    WHERE mp1.user_id = auth.uid()
  )
);