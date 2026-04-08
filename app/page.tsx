import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Heart, 
  Target, 
  Award, 
  Users, 
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Sparkles className="mr-2 h-4 w-4" />
                Win Big While Doing Good
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
                Your Golf Scores Can{" "}
                <span className="text-primary">Change Lives</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
                Enter your scores, compete in monthly draws, win exciting prizes, and support charities you care about. 
                A portion of every subscription goes directly to making a difference.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="#how-it-works">Learn How It Works</Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="container mx-auto mt-20 px-4">
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
              <Card className="border-none bg-card/50 backdrop-blur">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$50K+</p>
                    <p className="text-sm text-muted-foreground">Prizes Awarded</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none bg-card/50 backdrop-blur">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <Heart className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$25K+</p>
                    <p className="text-sm text-muted-foreground">Donated to Charity</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none bg-card/50 backdrop-blur">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">2,500+</p>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">Simple Process</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                How It Works
              </h2>
              <p className="text-muted-foreground">
                Join thousands of golfers making a difference while playing the game they love.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Subscribe",
                  description: "Choose monthly or yearly. Pick your charity and contribution percentage."
                },
                {
                  step: "02",
                  icon: Target,
                  title: "Enter Scores",
                  description: "Submit your last 5 golf scores in Stableford format (1-45 points)."
                },
                {
                  step: "03",
                  icon: Calendar,
                  title: "Monthly Draw",
                  description: "Your scores become your entry numbers for the monthly prize draw."
                },
                {
                  step: "04",
                  icon: Award,
                  title: "Win & Give",
                  description: "Match numbers to win prizes. Your charity contribution makes an impact."
                }
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-4xl font-bold text-primary/20">{item.step}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prize Pool Section */}
        <section id="prizes" className="bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">Prize Pool</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Win Big Every Month
              </h2>
              <p className="text-muted-foreground">
                Match your golf scores with the winning numbers for a chance to win exciting prizes.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 border-accent">
                <div className="absolute right-0 top-0 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  JACKPOT
                </div>
                <CardHeader className="pb-2 pt-8">
                  <CardTitle className="text-center text-2xl">5-Number Match</CardTitle>
                  <CardDescription className="text-center">All 5 numbers match</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-4xl font-bold text-accent">40%</p>
                  <p className="text-sm text-muted-foreground">of prize pool</p>
                  <Badge variant="secondary" className="mt-4">Rollover if unclaimed</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl">4-Number Match</CardTitle>
                  <CardDescription className="text-center">4 numbers match</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-4xl font-bold text-primary">35%</p>
                  <p className="text-sm text-muted-foreground">of prize pool</p>
                  <Badge variant="outline" className="mt-4">Split among winners</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl">3-Number Match</CardTitle>
                  <CardDescription className="text-center">3 numbers match</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-4xl font-bold text-primary">25%</p>
                  <p className="text-sm text-muted-foreground">of prize pool</p>
                  <Badge variant="outline" className="mt-4">Split among winners</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Charities Section */}
        <section id="charities" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">Making Impact</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Support Causes You Care About
              </h2>
              <p className="text-muted-foreground">
                Choose from our curated list of charities and set your contribution percentage. 
                Minimum 10% of your subscription fee goes directly to your chosen charity.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Golf for Good Foundation",
                  description: "Bringing golf to underprivileged communities and teaching life skills to young people.",
                  icon: Heart
                },
                {
                  name: "Green Fairways Initiative",
                  description: "Promoting environmental sustainability in golf courses worldwide.",
                  icon: TrendingUp
                },
                {
                  name: "Veterans on the Green",
                  description: "Supporting military veterans through golf therapy programs.",
                  icon: Award
                }
              ].map((charity) => (
                <Card key={charity.name} className="group transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <charity.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{charity.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{charity.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button variant="outline" asChild>
                <Link href="#charities">
                  View All Charities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4">Pricing</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground">
                Choose the plan that works for you. Cancel anytime.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Monthly Plan</CardTitle>
                  <CardDescription>Perfect for trying out the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">$29.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Enter monthly prize draws",
                      "Track up to 5 golf scores",
                      "Choose your charity",
                      "Full dashboard access",
                      "Winner verification support"
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/auth/sign-up?plan=monthly">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative border-2 border-primary">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Save 20%</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Yearly Plan</CardTitle>
                  <CardDescription>Best value for committed golfers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">$287.90</span>
                    <span className="text-muted-foreground">/year</span>
                    <p className="text-sm text-muted-foreground mt-1">$23.99/month equivalent</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "All monthly features",
                      "Priority support",
                      "Early access to new features",
                      "Exclusive yearly member events",
                      "Bonus charity contribution"
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/auth/sign-up?plan=yearly">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Ready to Make a Difference?
              </h2>
              <p className="mx-auto mb-8 max-w-xl opacity-90">
                Join thousands of golfers who are winning prizes while supporting causes they believe in.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/sign-up">
                  Start Your Journey Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
