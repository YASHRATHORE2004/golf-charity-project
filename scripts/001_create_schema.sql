-- Golf Charity Subscription Platform Database Schema
-- This script creates all necessary tables for the platform

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Charities table
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_received DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscription Plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  charity_id UUID REFERENCES public.charities(id),
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Golf Scores table (rolling 5 scores per user)
CREATE TABLE IF NOT EXISTS public.golf_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Draws table
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date DATE NOT NULL,
  draw_month INTEGER NOT NULL,
  draw_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulation', 'published')),
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_pool DECIMAL(10,2) DEFAULT 0,
  five_match_pool DECIMAL(10,2) DEFAULT 0,
  four_match_pool DECIMAL(10,2) DEFAULT 0,
  three_match_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_amount DECIMAL(10,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 7. Draw Entries table (user participation in draws)
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_numbers INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- 8. Winners table
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('5-match', '4-match', '3-match')),
  prize_amount DECIMAL(10,2) NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  proof_url TEXT,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- 9. Charity Contributions table
CREATE TABLE IF NOT EXISTS public.charity_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('subscription', 'donation')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Prize Pool Config table
CREATE TABLE IF NOT EXISTS public.prize_pool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  five_match_percentage INTEGER DEFAULT 40,
  four_match_percentage INTEGER DEFAULT 35,
  three_match_percentage INTEGER DEFAULT 25,
  contribution_per_subscription DECIMAL(10,2) DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for charities (public read, admin write)
CREATE POLICY "charities_select_all" ON public.charities FOR SELECT USING (TRUE);
CREATE POLICY "charities_insert_admin" ON public.charities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "charities_update_admin" ON public.charities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "charities_delete_admin" ON public.charities FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "plans_select_all" ON public.subscription_plans FOR SELECT USING (TRUE);
CREATE POLICY "plans_admin" ON public.subscription_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_admin" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for golf_scores
CREATE POLICY "scores_select_own" ON public.golf_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scores_insert_own" ON public.golf_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scores_update_own" ON public.golf_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scores_delete_own" ON public.golf_scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "scores_admin" ON public.golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for draws (public read published, admin all)
CREATE POLICY "draws_select_published" ON public.draws FOR SELECT USING (status = 'published' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "draws_admin" ON public.draws FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for draw_entries
CREATE POLICY "entries_select_own" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "entries_insert_own" ON public.draw_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entries_admin" ON public.draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for winners
CREATE POLICY "winners_select_own" ON public.winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "winners_update_own" ON public.winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "winners_admin" ON public.winners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for charity_contributions
CREATE POLICY "contributions_select_own" ON public.charity_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contributions_insert_own" ON public.charity_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contributions_admin" ON public.charity_contributions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for prize_pool_config
CREATE POLICY "config_select_all" ON public.prize_pool_config FOR SELECT USING (TRUE);
CREATE POLICY "config_admin" ON public.prize_pool_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'is_admin')::boolean, FALSE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, interval) VALUES
  ('Monthly Plan', 'Access all features with monthly billing', 29.99, 'monthly'),
  ('Yearly Plan', 'Save 20% with annual billing', 287.88, 'yearly')
ON CONFLICT DO NOTHING;

-- Insert default prize pool config
INSERT INTO public.prize_pool_config (five_match_percentage, four_match_percentage, three_match_percentage, contribution_per_subscription)
VALUES (40, 35, 25, 10)
ON CONFLICT DO NOTHING;

-- Insert sample charities
INSERT INTO public.charities (name, description, image_url, is_featured, is_active) VALUES
  ('Golf for Good Foundation', 'Supporting youth golf programs and making the sport accessible to underprivileged communities.', '/charities/golf-good.jpg', TRUE, TRUE),
  ('Green Course Initiative', 'Environmental sustainability in golf - protecting natural habitats and promoting eco-friendly courses.', '/charities/green-course.jpg', TRUE, TRUE),
  ('Veterans on the Green', 'Providing therapeutic golf experiences for military veterans recovering from physical and mental injuries.', '/charities/veterans.jpg', FALSE, TRUE),
  ('Junior Golf Champions', 'Funding scholarships and equipment for talented young golfers from low-income families.', '/charities/junior-golf.jpg', FALSE, TRUE)
ON CONFLICT DO NOTHING;
