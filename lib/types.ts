export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  is_active: boolean
  total_received: number
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  interval: 'monthly' | 'yearly'
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  charity_id: string | null
  charity_percentage: number
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  start_date: string
  end_date: string | null
  renewal_date: string | null
  created_at: string
  updated_at: string
  plan?: SubscriptionPlan
  charity?: Charity
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_date: string
  created_at: string
}

export interface Draw {
  id: string
  draw_date: string
  draw_month: number
  draw_year: number
  status: 'pending' | 'simulation' | 'published'
  draw_type: 'random' | 'algorithmic'
  winning_numbers: number[]
  total_pool: number
  five_match_pool: number
  four_match_pool: number
  three_match_pool: number
  jackpot_amount: number
  jackpot_rolled_over: boolean
  created_at: string
  published_at: string | null
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  entry_numbers: number[]
  match_count: number
  is_winner: boolean
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  match_type: '5-match' | '4-match' | '3-match'
  prize_amount: number
  verification_status: 'pending' | 'submitted' | 'approved' | 'rejected'
  proof_url: string | null
  payout_status: 'pending' | 'paid'
  created_at: string
  verified_at: string | null
  paid_at: string | null
  profile?: Profile
  draw?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  subscription_id: string | null
  amount: number
  contribution_type: 'subscription' | 'donation'
  created_at: string
  charity?: Charity
}

export interface PrizePoolConfig {
  id: string
  five_match_percentage: number
  four_match_percentage: number
  three_match_percentage: number
  contribution_per_subscription: number
  updated_at: string
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalPrizePool: number
  totalCharityContributions: number
  currentMonthEntries: number
  pendingVerifications: number
}
