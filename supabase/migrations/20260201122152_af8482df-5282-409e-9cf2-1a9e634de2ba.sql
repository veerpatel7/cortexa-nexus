-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'lobby', 'live', 'ended')),
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recording_enabled BOOLEAN DEFAULT false,
  transcription_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting participants
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('host', 'co-host', 'member', 'guest')),
  is_muted BOOLEAN DEFAULT true,
  is_video_on BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create breakout rooms table
CREATE TABLE public.breakout_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create breakout room participants
CREATE TABLE public.breakout_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakout_room_id UUID REFERENCES public.breakout_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(breakout_room_id, user_id)
);

-- Create whiteboard annotations table
CREATE TABLE public.whiteboard_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool TEXT NOT NULL,
  color TEXT NOT NULL,
  stroke_width INTEGER DEFAULT 2,
  points JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakout_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_annotations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meetings policies
CREATE POLICY "Users can view meetings they participate in" ON public.meetings 
  FOR SELECT USING (
    host_id = auth.uid() OR 
    id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "Authenticated users can create meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update meetings" ON public.meetings FOR UPDATE USING (auth.uid() = host_id);

-- Meeting participants policies
CREATE POLICY "Participants can view other participants" ON public.meeting_participants FOR SELECT USING (
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Hosts can manage participants" ON public.meeting_participants FOR ALL USING (
  meeting_id IN (SELECT id FROM public.meetings WHERE host_id = auth.uid())
);
CREATE POLICY "Users can update own participant status" ON public.meeting_participants FOR UPDATE USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Participants can view chat" ON public.chat_messages FOR SELECT USING (
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);

-- Message reactions policies
CREATE POLICY "Participants can view reactions" ON public.message_reactions FOR SELECT USING (
  message_id IN (SELECT id FROM public.chat_messages WHERE meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Breakout rooms policies
CREATE POLICY "Participants can view breakout rooms" ON public.breakout_rooms FOR SELECT USING (
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Hosts can manage breakout rooms" ON public.breakout_rooms FOR ALL USING (
  meeting_id IN (SELECT id FROM public.meetings WHERE host_id = auth.uid())
);

-- Breakout room participants policies
CREATE POLICY "View breakout room participants" ON public.breakout_room_participants FOR SELECT USING (
  breakout_room_id IN (SELECT id FROM public.breakout_rooms WHERE meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid()))
);
CREATE POLICY "Hosts can assign participants" ON public.breakout_room_participants FOR ALL USING (
  breakout_room_id IN (SELECT id FROM public.breakout_rooms WHERE meeting_id IN (SELECT id FROM public.meetings WHERE host_id = auth.uid()))
);

-- Whiteboard policies
CREATE POLICY "Participants can view annotations" ON public.whiteboard_annotations FOR SELECT USING (
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can draw" ON public.whiteboard_annotations FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  meeting_id IN (SELECT meeting_id FROM public.meeting_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own annotations" ON public.whiteboard_annotations FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for chat and whiteboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_room_participants;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();