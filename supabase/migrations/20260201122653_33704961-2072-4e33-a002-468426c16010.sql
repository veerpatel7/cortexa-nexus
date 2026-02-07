-- Create storage bucket for meeting files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('meeting-files', 'meeting-files', true, 52428800);

-- Create policies for meeting files bucket
CREATE POLICY "Authenticated users can upload meeting files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view meeting files"
ON storage.objects FOR SELECT
USING (bucket_id = 'meeting-files');

CREATE POLICY "Users can delete own uploaded files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table to track shared files in meetings
CREATE TABLE public.meeting_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;

-- Policies for meeting files table
CREATE POLICY "Participants can view meeting files"
ON public.meeting_files FOR SELECT
USING (
  meeting_id IN (
    SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Participants can upload files"
ON public.meeting_files FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND meeting_id IN (
    SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own files"
ON public.meeting_files FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for file sharing
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_files;