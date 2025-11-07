import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LineChart,
  ShieldCheck,
  Users2,
  Sparkles,
  Layers,
} from 'lucide-react';

const features = [
  {
    title: 'Studio-grade governance',
    description:
      'Decision gates, milestones, and KPI guardrails keep every venture accountable without slowing the team down.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational visibility',
    description:
      'Unified dashboards for ventures, experiments, resources, and fundraising so leadership can see signal instantly.',
    icon: LineChart,
  },
  {
    title: 'Founder enablement',
    description:
      'Templates, playbooks, and experimentation workflows help venture leads move from insight to launch faster.',
    icon: Sparkles,
  },
];

const stats = [
  { label: 'Active ventures', value: '18', detail: 'spanning healthcare, logistics, and community tech' },
  { label: 'Experiments shipped', value: '240+', detail: 'validated with live pilots and field studies' },
  { label: 'Capital stewarded', value: '$35M', detail: 'across multi-stage studio programs' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CityReach</p>
            <h1 className="text-xl font-semibold text-white">Innovation Labs</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-white transition"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-900/30 transition hover:translate-y-0.5"
            >
              Launch Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent-300">
                Studio Operating System
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent-500" />
              </p>
              <h2 className="mt-6 text-4xl sm:text-5xl font-bold leading-tight text-white">
                Accelerate venture building with
                <span className="block mt-2 bg-gradient-to-r from-brand-200 to-accent-400 bg-clip-text text-transparent">
                  orchestration built for CityReach
                </span>
              </h2>
              <p className="mt-6 text-lg text-slate-300">
                CityReach Innovation Labs unifies idea intake, venture delivery, experimentation, and capital
                planning so every team sees the same source of truth—from first hypothesis to scale.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/15"
                >
                  View live workspace
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:labs@cityreach.org"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40"
                >
                  Request a walkthrough
                </a>
              </div>

              <div className="mt-12 grid sm:grid-cols-3 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 mt-1">{stat.label}</p>
                    <p className="mt-2 text-xs text-slate-400">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-accent-600/30 rounded-full" />
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-brand-900 to-slate-900 p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Studio KPIs</span>
                  <span>Live sync</span>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-900/70 border border-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-400">Monthly Recurring Revenue</p>
                        <p className="text-2xl font-semibold text-white">$1.4M</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-300">
                        +14.7%
                        <ArrowRight className="w-3 h-3 rotate-45" />
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 border border-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-400">Experiment Velocity</p>
                        <p className="text-2xl font-semibold text-white">32 / month</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-200">
                        Ops ready
                        <Layers className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 border border-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-400">Runway Coverage</p>
                        <p className="text-2xl font-semibold text-white">18.4 months</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-200">
                        Funded
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-sm text-slate-400">Trusted by venture partners</p>
                  <div className="mt-3 flex gap-3">
                    <div className="flex -space-x-3">
                      {['CR', 'IL', 'ST', 'RX'].map((initials) => (
                        <div
                          key={initials}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white ring-2 ring-slate-950"
                        >
                          {initials}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">Cross-functional squads stay aligned every week.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/60 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-700 text-white mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Inside the platform</p>
          <h3 className="mt-4 text-3xl font-bold text-white">Bring ventures, experiments, and capital into one motion.</h3>
          <p className="mt-4 text-base text-slate-400">
            Secure authentication, audit trails, and GCP-native persistence ensure CityReach teams can safely collaborate with partners while keeping sensitive data in-region.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-900/40 hover:bg-accent-500 transition"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:labs@cityreach.org?subject=CityReach%20Innovation%20Labs%20Demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:border-white transition"
            >
              Talk with our team
              <Users2 className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-500 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CityReach Innovation Labs</span>
          <span className="flex items-center gap-2 text-slate-400">
            Purpose-built in CityReach Studios
          </span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
