import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Video,
  Camera,
  ScanLine,
  FileText,
  Users,
  Wallet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Send,
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  Play,
  Pause,
  Gauge,
  Package,
  TrendingDown,
  Zap,
  ArrowRight,
  Boxes,
  Ruler,
  Factory,
  Timer,
  Weight,
  LogOut,
  RotateCcw,
  Lock,
  Mail,
  Building2,
  Wrench,
  BadgeCheck,
} from 'lucide-react'

/* =========================================================
   Constants
   ========================================================= */

const VALID_EMAIL = 'dev@polyborg.ai'
const VALID_PASSWORD = 'polyborg@123!'

const AUTH_KEY = 'polyborg_auth_token'
const STATE_KEY = 'polyborg_workspace_state'

const MOTTO = 'The bottleneck is coordination, not robotics.'

const INITIAL_STATE = {
  currentStage: 0,
  scopeSpecs: null,
  selectedBuilder: null,
  customPriceSettings: { revealHidden: false },
  robotRunning: true,
  simulationLogs: [],
}

/* ---------- session storage helpers ---------- */

function readSession(key, fallback) {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeSession(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private browsing. The application still
    // works for the current page view, it simply will not survive a refresh.
  }
}

function clearSession(key) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Nothing to do. See the note in writeSession.
  }
}

/* ---------- data ---------- */

const SCAN_STEPS = [
  'Scanning floor area',
  'Identifying task bounds',
  'Creating specifications',
]

const GENERATED_SPECS = [
  { icon: 'Package', label: 'Task the robot will perform', value: 'Palletizing and box stacking' },
  { icon: 'Timer', label: 'Speed target', value: '15 items per minute' },
  { icon: 'Factory', label: 'Working environment', value: 'Sanitary food packaging line' },
  { icon: 'Weight', label: 'Weight of each item', value: 'Up to 12 kilograms' },
  { icon: 'Ruler', label: 'Reach the arm requires', value: '1.8 metres from its base' },
  { icon: 'Boxes', label: 'Floor space measured', value: '4.2 metres by 3.1 metres' },
  { icon: 'Clock', label: 'Running hours required', value: 'Two shifts, sixteen hours a day' },
  { icon: 'ShieldCheck', label: 'Safety requirement', value: 'Fenced area with door sensors' },
]

const SPEC_ICONS = {
  Package,
  Timer,
  Factory,
  Weight,
  Ruler,
  Boxes,
  Clock,
  ShieldCheck,
}

const INDUSTRIES = ['Food Packaging', 'Metal Cutting', 'Building Products']
const ROBOT_BRANDS = ['Any brand', 'Ironwood', 'Vantex', 'Meridian']

const BUILDERS = [
  {
    id: 'halstead',
    name: 'Halstead Integrations',
    town: 'Sheffield',
    industries: ['Food Packaging', 'Building Products'],
    brands: ['Ironwood', 'Vantex'],
    rating: 4.8,
    projects: 34,
    reply: 'Replies in about 2 days',
    note: 'Strong record on sanitary food lines and washdown areas.',
  },
  {
    id: 'kestrel',
    name: 'Kestrel Robotics',
    town: 'Birmingham',
    industries: ['Food Packaging', 'Metal Cutting'],
    brands: ['Vantex', 'Meridian'],
    rating: 4.6,
    projects: 51,
    reply: 'Replies in about 1 day',
    note: 'Specialists in computer-controlled metal cutting and pressing machines.',
  },
  {
    id: 'northgate',
    name: 'Northgate Systems',
    town: 'Leeds',
    industries: ['Metal Cutting', 'Building Products'],
    brands: ['Ironwood', 'Meridian'],
    rating: 4.5,
    projects: 27,
    reply: 'Replies in about 3 days',
    note: 'Handles heavy building product handling and stacking.',
  },
  {
    id: 'brightwell',
    name: 'Brightwell Automation',
    town: 'Manchester',
    industries: ['Food Packaging', 'Metal Cutting', 'Building Products'],
    brands: ['Ironwood', 'Vantex', 'Meridian'],
    rating: 4.9,
    projects: 62,
    reply: 'Replies in about 1 day',
    note: 'Also fits self-driving warehouse robots alongside fixed arms.',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Line Works',
    town: 'Bristol',
    industries: ['Food Packaging'],
    brands: ['Ironwood'],
    rating: 4.4,
    projects: 19,
    reply: 'Replies in about 4 days',
    note: 'Smaller team, works on one packaging line at a time.',
  },
]

const BIDS = [
  {
    id: 'northgate',
    name: 'Northgate Systems',
    town: 'Leeds',
    base: 128500,
    weeks: 15,
    warranty: 'Twelve months',
    hidden: [
      { label: 'Custom gripping tools built for your boxes', amount: 9800 },
      { label: 'Cutting and nesting the metal frame parts', amount: 6600 },
      { label: 'Installation and switch on labour', amount: 8500 },
    ],
  },
  {
    id: 'kestrel',
    name: 'Kestrel Robotics',
    town: 'Birmingham',
    base: 132000,
    weeks: 12,
    warranty: 'Eighteen months',
    hidden: [
      { label: 'Custom gripping tools built for your boxes', amount: 8400 },
      { label: 'Training your team to run the machine', amount: 4500 },
      { label: 'Starter set of spare parts', amount: 6000 },
    ],
  },
  {
    id: 'halstead',
    name: 'Halstead Integrations',
    town: 'Sheffield',
    base: 136000,
    weeks: 11,
    warranty: 'Twenty four months',
    hidden: [
      { label: 'Custom gripping tools built for your boxes', amount: 7200 },
      { label: 'Safety fencing and door sensors', amount: 4100 },
      { label: 'Installation and switch on labour', amount: 4100 },
    ],
  },
]

const TARGET_SPEED = 15
const RUNNING_SPEED = 16
const MAX_SPEED = 24
const MONTHLY_FEE = 4850

const STAGES = [
  { id: 0, key: 'scope', label: 'Scope', step: 'Stage one', icon: Video },
  { id: 1, key: 'source', label: 'Source', step: 'Stage two', icon: Users },
  { id: 2, key: 'price', label: 'Price', step: 'Stage three', icon: Wallet },
  { id: 3, key: 'run', label: 'Deliver and Run', step: 'Stage four', icon: Activity },
]

const money = (n) => '$' + n.toLocaleString('en-US')

function timeStamp() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/* =========================================================
   Shared building blocks
   ========================================================= */

function Logo({ size = 'normal' }) {
  const box = size === 'large' ? 'h-12 w-12' : 'h-9 w-9'
  const glyph = size === 'large' ? 'h-7 w-7' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex ${box} shrink-0 items-center justify-center rounded-xl bg-signal-600 shadow-lg shadow-signal-600/30`}
      >
        <svg
          viewBox="0 0 24 24"
          className={glyph}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3 L19 7 L19 15 L12 19 L5 15 L5 7 Z" />
          <circle cx="12" cy="11" r="2.6" fill="#ffffff" stroke="none" />
        </svg>
      </div>
      <div className="leading-tight">
        <div
          className={`font-bold tracking-tight text-white ${
            size === 'large' ? 'text-xl' : 'text-[15px]'
          }`}
        >
          Polyborg AI
        </div>
        <div className="font-mono text-[10px] tracking-[0.16em] text-teal-400 uppercase">
          Coordination Layer
        </div>
      </div>
    </div>
  )
}

function InfoBox({ title, body, todo }) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-teal-500/25 bg-teal-500/[0.06]">
      <div className="flex items-center gap-2 border-b border-teal-500/20 bg-teal-500/10 px-4 py-2.5 sm:px-5">
        <Info className="h-4 w-4 shrink-0 text-teal-300" />
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-teal-300 uppercase">
          How this works
        </span>
      </div>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <p className="text-[15px] font-semibold text-white">{title}</p>
        <p className="text-sm leading-relaxed text-slate-300">{body}</p>
        <div className="flex items-start gap-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3.5 py-3">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-signal-300" />
          <p className="text-sm leading-relaxed text-slate-200">
            <span className="font-semibold text-signal-300">What you do here: </span>
            {todo}
          </p>
        </div>
      </div>
    </div>
  )
}

function PageTitle({ step, title, subtitle }) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-signal-400 uppercase">
        {step}
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>
    </div>
  )
}

function Panel({ title, icon: IconCmp, accent, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 sm:px-5">
          {IconCmp && <IconCmp className={`h-4 w-4 ${accent || 'text-slate-400'}`} />}
          <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function Toast({ message, tone }) {
  const good = tone !== 'warn'
  return (
    <div className="toast-in pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md lg:inset-x-auto lg:right-8 lg:bottom-8 lg:mx-0">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-2xl backdrop-blur ${
          good
            ? 'border-teal-400/40 bg-teal-950/90'
            : 'border-amber-400/40 bg-amber-950/90'
        }`}
      >
        {good ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        )}
        <p className="text-sm leading-relaxed text-slate-100">{message}</p>
      </div>
    </div>
  )
}

/* =========================================================
   Login
   ========================================================= */

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const next = {}

    if (!email.trim()) next.email = 'Please enter your email address.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = 'That does not look like a complete email address.'

    if (!password) next.password = 'Please enter your password.'

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    setSubmitting(true)
    setErrors({})

    window.setTimeout(() => {
      const emailMatches = email.trim().toLowerCase() === VALID_EMAIL
      const passwordMatches = password === VALID_PASSWORD

      if (emailMatches && passwordMatches) {
        onLogin(VALID_EMAIL)
        return
      }

      setSubmitting(false)
      if (!emailMatches && !passwordMatches) {
        setErrors({ form: 'That email address and password combination was not recognised.' })
      } else if (!emailMatches) {
        setErrors({ email: 'We do not have an account with that email address.' })
      } else {
        setErrors({ password: 'That password is not correct for this account.' })
      }
    }, 450)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 font-sans">
      <div className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl lg:grid-cols-2">
          {/* ---------- explanation side ---------- */}
          <div className="order-2 border-slate-800 bg-slate-950/60 p-7 sm:p-9 lg:order-1 lg:border-r">
            <Logo size="large" />

            <h1 className="mt-7 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              The coordination layer for industrial automation
            </h1>

            <div className="mt-6 overflow-hidden rounded-xl border border-teal-500/25 bg-teal-500/[0.06]">
              <div className="flex items-center gap-2 border-b border-teal-500/20 bg-teal-500/10 px-4 py-2.5">
                <Info className="h-4 w-4 shrink-0 text-teal-300" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-teal-300 uppercase">
                  What this portal is for
                </span>
              </div>
              <div className="space-y-3 px-4 py-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  This is a secure portal built for factory operators. You use it to plan, price and
                  track a robot project for your production line, from the first idea through to the
                  machine running on your floor.
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  Everything runs as a software subscription, so there are no large upfront buying
                  costs or capital expenses to approve before you begin.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                'Describe your job in a single day using a phone video, not months of complex three-dimensional computer drawings.',
                'Reach checked local robot builders instantly, and send every one of them the identical plan.',
                'Compare all prices in one shared layout, with the costs each builder left out shown clearly.',
                'Pay only for the hours your robot genuinely runs at the speed you agreed.',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span className="text-sm leading-relaxed text-slate-400">{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-2.5 border-t border-slate-800 pt-5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
              </span>
              <span className="text-[13px] font-medium text-slate-400">{MOTTO}</span>
            </div>
          </div>

          {/* ---------- form side ---------- */}
          <div className="order-1 flex items-center p-7 sm:p-9 lg:order-2">
            <form onSubmit={handleSubmit} className="w-full" noValidate>
              <h2 className="text-xl font-bold tracking-tight text-white">Sign in to your portal</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Enter the details for your factory account to continue.
              </p>

              {errors.form && (
                <div className="fade-rise mt-5 flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm leading-relaxed text-red-200">{errors.form}</p>
                </div>
              )}

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase"
                  >
                    Email address
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-lg border bg-slate-950/60 px-3.5 transition-colors focus-within:border-signal-500 ${
                      errors.email ? 'border-red-500/60' : 'border-slate-700'
                    }`}
                  >
                    <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email || errors.form) setErrors({})
                      }}
                      placeholder="you@yourfactory.com"
                      className="w-full bg-transparent py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                  {errors.email && (
                    <p className="fade-rise mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase"
                  >
                    Password
                  </label>
                  <div
                    className={`flex items-center gap-2.5 rounded-lg border bg-slate-950/60 px-3.5 transition-colors focus-within:border-signal-500 ${
                      errors.password ? 'border-red-500/60' : 'border-slate-700'
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password || errors.form) setErrors({})
                      }}
                      placeholder="Enter your password"
                      className="w-full bg-transparent py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="fade-rise mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-signal-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-signal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-70"
              >
                {submitting ? 'Checking your details' : 'Sign in'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3.5">
                <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
                  Demonstration account
                </div>
                <dl className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="text-slate-300">{VALID_EMAIL}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Password</dt>
                    <dd className="text-slate-300">{VALID_PASSWORD}</dd>
                  </div>
                </dl>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Polyborg AI demonstration portal. All builders, prices and factory details shown are
          examples created for this walkthrough.
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   Shell: header and navigation
   ========================================================= */

function Header({ email, onLogout, onReset }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>

        <div className="hidden min-w-0 items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 lg:flex">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          <span className="truncate text-[13px] font-medium text-slate-300">{MOTTO}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            title="Clear the saved progress and start the four stages again"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 sm:px-3"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Reset application state</span>
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 pr-3 pl-2 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-signal-500/15 text-[10px] font-bold text-signal-300">
              DP
            </span>
            <span className="font-mono text-[11px] text-slate-400">{email}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg bg-signal-600 px-2.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-signal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-400 sm:px-3"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800/70 px-4 py-2 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
          </span>
          <span className="truncate text-[11.5px] text-slate-400">{MOTTO}</span>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ currentStage, goToStage, completed }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
      <div className="border-b border-slate-800 px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <div className="px-3 pt-2 pb-3 font-mono text-[10px] tracking-[0.14em] text-slate-600 uppercase">
          Project workflow
        </div>
        {STAGES.map((stage) => {
          const IconCmp = stage.icon
          const active = currentStage === stage.id
          const done = completed.includes(stage.key)
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => goToStage(stage.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-400 ${
                active
                  ? 'bg-signal-500/14 text-white ring-1 ring-signal-500/40 ring-inset'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <IconCmp className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-signal-400' : ''}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{stage.label}</span>
                <span className="block font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  {stage.step}
                </span>
              </span>
              {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-teal-400 uppercase">
              Why this exists
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            The average factory waits about thirty five weeks to get one robot working. Almost none
            of that wait is the robot itself. It is people waiting on each other.
          </p>
        </div>
      </div>
    </aside>
  )
}

function BottomNav({ currentStage, goToStage, completed }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden">
      <div className="flex items-stretch">
        {STAGES.map((stage) => {
          const IconCmp = stage.icon
          const active = currentStage === stage.id
          const done = completed.includes(stage.key)
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => goToStage(stage.id)}
              className={`relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5 transition-colors ${
                active ? 'text-signal-400' : 'text-slate-500'
              }`}
            >
              {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-signal-600" />}
              <span className="relative">
                <IconCmp className="h-[19px] w-[19px]" />
                {done && !active && (
                  <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                )}
              </span>
              <span className="text-[10px] leading-none font-semibold">
                {stage.id === 3 ? 'Run' : stage.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

/* =========================================================
   Stage one: Scope
   ========================================================= */

function ScopeStage({ scopeSpecs, setScopeSpecs, notify, addLog }) {
  const [localPhase, setLocalPhase] = useState('idle')
  const [rawProgress, setRawProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)

  // Derived while rendering rather than synchronised through an effect. This
  // keeps the saved specification sheet visible after a refresh, and returns
  // the stage to its starting view the moment the application state is reset.
  const phase = scopeSpecs ? 'done' : localPhase === 'done' ? 'idle' : localPhase
  const progress = phase === 'done' ? 100 : rawProgress

  useEffect(() => {
    if (phase !== 'recording') return undefined
    const tick = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    const finish = window.setTimeout(() => {
      setRawProgress(0)
      setStepIndex(0)
      setLocalPhase('scanning')
    }, 3200)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(finish)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'scanning') return undefined
    const id = window.setInterval(() => {
      setRawProgress((p) => {
        const next = p + 2
        if (next >= 100) {
          window.clearInterval(id)
          setLocalPhase('done')
          setScopeSpecs(GENERATED_SPECS)
          addLog('Project specification sheet created from the factory floor video.')
          notify(
            'Your project specification sheet is ready and saved. It stays here even if you refresh the page.',
          )
          return 100
        }
        setStepIndex(Math.min(SCAN_STEPS.length - 1, Math.floor(next / 34)))
        return next
      })
    }, 55)
    return () => window.clearInterval(id)
  }, [phase, setScopeSpecs, notify, addLog])

  function startRecording() {
    setSeconds(0)
    setLocalPhase('recording')
  }

  function recordAgain() {
    setScopeSpecs(null)
    setLocalPhase('idle')
    setRawProgress(0)
    setStepIndex(0)
    setSeconds(0)
  }

  return (
    <div className="fade-rise">
      <PageTitle
        step="Stage one"
        title="Scope: describe the job in a single day"
        subtitle="Record a short video of your factory floor on an ordinary phone. Polyborg turns that video into a written project plan that every builder can price against."
      />

      <InfoBox
        title="This replaces about nine weeks of waiting for engineering drawings."
        body="Traditional robot setups take months because everybody waits for complex three-dimensional computer drawings before anything else can start. An engineering firm has to visit, measure and draw your floor, and the whole project stands still until that document arrives. Polyborg does the same job in one day using a simple phone video, and writes the Business Requirements Document for you automatically."
        todo="Press the record button on the phone below. Polyborg reads the video, measures your space, and writes the project specification sheet. Nothing is typed in by hand, and the result is saved to your session."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div>
          <Panel title="Your phone camera" icon={Camera} accent="text-signal-400">
            <div className="mx-auto w-full max-w-[260px]">
              <div className="relative overflow-hidden rounded-[26px] border-4 border-slate-800 bg-slate-950 shadow-2xl">
                <div className="absolute inset-x-0 top-0 z-20 flex justify-center">
                  <div className="mt-1.5 h-1 w-14 rounded-full bg-slate-700" />
                </div>

                <div className="relative aspect-[9/16] overflow-hidden bg-slate-900">
                  <svg viewBox="0 0 180 320" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <defs>
                      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                    </defs>
                    <rect width="180" height="320" fill="url(#floorGrad)" />
                    <rect x="0" y="0" width="180" height="150" fill="#111c2e" />
                    <path d="M0 150 L180 150" stroke="#334155" strokeWidth="1.4" />
                    <path d="M30 320 L66 150" stroke="#233045" strokeWidth="1.2" />
                    <path d="M150 320 L114 150" stroke="#233045" strokeWidth="1.2" />
                    <path d="M0 235 L180 235" stroke="#233045" strokeWidth="1" />
                    <rect x="14" y="176" width="70" height="13" rx="2" fill="#1f2d42" stroke="#3b4d68" strokeWidth="1" />
                    <rect x="20" y="164" width="15" height="13" rx="1.5" fill="#7c5a3a" stroke="#a97c4f" strokeWidth="0.8" />
                    <rect x="44" y="164" width="15" height="13" rx="1.5" fill="#7c5a3a" stroke="#a97c4f" strokeWidth="0.8" />
                    <rect x="106" y="212" width="54" height="8" rx="1.5" fill="#3f3324" stroke="#5c4832" strokeWidth="0.9" />
                    <rect x="112" y="196" width="20" height="16" rx="1.5" fill="#7c5a3a" stroke="#a97c4f" strokeWidth="0.8" />
                    <rect x="135" y="196" width="20" height="16" rx="1.5" fill="#7c5a3a" stroke="#a97c4f" strokeWidth="0.8" />
                    <rect x="98" y="188" width="72" height="42" fill="none" stroke="#6f9bf0" strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />
                    <rect x="36" y="16" width="30" height="5" rx="2" fill="#334155" />
                    <rect x="112" y="16" width="30" height="5" rx="2" fill="#334155" />
                    <ellipse cx="51" cy="34" rx="26" ry="12" fill="#fbbf24" opacity="0.06" />
                    <ellipse cx="127" cy="34" rx="26" ry="12" fill="#fbbf24" opacity="0.06" />
                  </svg>

                  {phase === 'scanning' && (
                    <div className="absolute inset-0 z-10 overflow-hidden">
                      <div className="scan-sweep h-16 w-full bg-gradient-to-b from-transparent via-teal-400/25 to-transparent" />
                      <div className="absolute inset-0 border-2 border-teal-400/30" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div className="absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-white/40" />
                    <div className="absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-white/40" />
                    <div className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-white/40" />
                    <div className="absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-white/40" />
                  </div>

                  {phase === 'recording' && (
                    <div className="absolute top-9 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1">
                      <span className="rec-dot h-2 w-2 rounded-full bg-red-500" />
                      <span className="font-mono text-[10px] font-semibold text-white">
                        Recording {String(seconds).padStart(2, '0')} seconds
                      </span>
                    </div>
                  )}

                  {phase === 'done' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/80 px-4 text-center">
                      <CheckCircle2 className="h-9 w-9 text-teal-400" />
                      <p className="text-sm font-semibold text-white">Floor recorded</p>
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        Your written plan is saved.
                      </p>
                    </div>
                  )}

                  {phase === 'idle' && (
                    <div className="absolute inset-x-0 bottom-14 z-20 px-4 text-center">
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        Point the phone at the area where the robot will work.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center border-t border-slate-800 bg-slate-950 py-3.5">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={phase !== 'idle'}
                    aria-label="Record factory floor"
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-400 ${
                      phase === 'idle'
                        ? 'border-slate-700 bg-red-500 hover:bg-red-400'
                        : 'border-slate-800 bg-slate-700'
                    }`}
                  >
                    {phase === 'recording' ? (
                      <span className="h-3.5 w-3.5 rounded-sm bg-white" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full bg-white/90" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={phase === 'done' ? recordAgain : startRecording}
                disabled={phase === 'recording' || phase === 'scanning'}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${
                  phase === 'idle'
                    ? 'bg-signal-600 text-white hover:bg-signal-500 focus-visible:ring-signal-400'
                    : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-500'
                }`}
              >
                {phase === 'idle' && (
                  <>
                    <Video className="h-4 w-4" /> Record factory floor
                  </>
                )}
                {phase === 'recording' && (
                  <>
                    <span className="rec-dot h-2 w-2 rounded-full bg-red-500" /> Recording your floor
                  </>
                )}
                {phase === 'scanning' && (
                  <>
                    <ScanLine className="h-4 w-4" /> Reading the video
                  </>
                )}
                {phase === 'done' && (
                  <>
                    <Camera className="h-4 w-4" /> Record the floor again
                  </>
                )}
              </button>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          {(phase === 'scanning' || phase === 'done') && (
            <Panel title="What Polyborg is doing" icon={ScanLine} accent="text-teal-400">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-slate-200">
                  {phase === 'done' ? 'Finished' : SCAN_STEPS[stepIndex]}
                </span>
                <span className="font-mono text-sm font-semibold text-teal-400 tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all duration-100"
                  style={{ width: progress + '%' }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {SCAN_STEPS.map((label, i) => {
                  const state =
                    phase === 'done' || i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo'
                  return (
                    <li key={label} className="flex items-center gap-2.5">
                      {state === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                      ) : (
                        <span
                          className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                            state === 'active' ? 'animate-pulse border-teal-400' : 'border-slate-700'
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          state === 'todo'
                            ? 'text-slate-500'
                            : state === 'active'
                              ? 'text-white'
                              : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}

          {phase === 'done' && scopeSpecs && (
            <div className="fade-rise">
              <Panel title="Project specification sheet" icon={FileText} accent="text-signal-400">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-teal-300 uppercase">
                    Saved to your session
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Written in one day, not nine weeks
                  </span>
                </div>

                <dl className="grid gap-2.5 sm:grid-cols-2">
                  {scopeSpecs.map((row) => {
                    const RowIcon = SPEC_ICONS[row.icon] || FileText
                    return (
                      <div
                        key={row.label}
                        className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5"
                      >
                        <dt className="mb-1.5 flex items-center gap-2">
                          <RowIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                            {row.label}
                          </span>
                        </dt>
                        <dd className="text-sm leading-snug font-semibold text-white">{row.value}</dd>
                      </div>
                    )
                  })}
                </dl>

                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-signal-500/25 bg-signal-500/[0.09] px-3.5 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-signal-300" />
                  <p className="text-xs leading-relaxed text-slate-300">
                    This single sheet is what every builder will price against. Because they all read
                    the identical sheet, their prices can finally be compared side by side.
                  </p>
                </div>
              </Panel>
            </div>
          )}

          {phase === 'idle' && (
            <Panel title="What you will receive" icon={FileText} accent="text-slate-400">
              <p className="mb-4 text-sm leading-relaxed text-slate-400">
                Once you record your floor, this space fills with a complete written plan covering the
                task, the speed, the space, the safety rules and the working hours.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {GENERATED_SPECS.slice(0, 4).map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-3.5"
                  >
                    <div className="mb-2 font-mono text-[10px] tracking-[0.1em] text-slate-600 uppercase">
                      {row.label}
                    </div>
                    <div className="h-3 w-3/4 rounded bg-slate-800" />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Stage two: Source
   ========================================================= */

function SourceStage({ selectedBuilder, setSelectedBuilder, notify, addLog }) {
  const [industry, setIndustry] = useState('Food Packaging')
  const [brand, setBrand] = useState('Any brand')
  const [planSent, setPlanSent] = useState(false)

  const matched = useMemo(
    () =>
      BUILDERS.filter(
        (b) =>
          b.industries.includes(industry) && (brand === 'Any brand' || b.brands.includes(brand)),
      ),
    [industry, brand],
  )

  // Changing a filter produces a different set of builders, so the "plan sent"
  // confirmation no longer applies. Cleared from the change handlers rather
  // than an effect, so there is no extra render pass.
  function changeIndustry(value) {
    setIndustry(value)
    setPlanSent(false)
  }

  function changeBrand(value) {
    setBrand(value)
    setPlanSent(false)
  }

  function choose(builder) {
    setSelectedBuilder(builder.id)
    addLog(`Selected ${builder.name} as the preferred robot builder.`)
    notify(
      `${builder.name} is now your selected builder. This choice is saved and stays selected if you refresh the page.`,
    )
  }

  function sendPlan() {
    if (matched.length === 0) return
    setPlanSent(true)
    addLog(`Identical project plan sent to ${matched.length} matched builders.`)
    notify(
      `Your identical project plan was sent to all ${matched.length} matched ${
        matched.length === 1 ? 'builder' : 'builders'
      }. Every one of them received exactly the same information.`,
    )
  }

  return (
    <div className="fade-rise">
      <PageTitle
        step="Stage two"
        title="Source: find builders who can actually do it"
        subtitle="Choose what your factory makes and which robot brand you prefer. Polyborg matches you to checked builders and sends them all the identical plan at the same moment."
      />

      <InfoBox
        title="This replaces about eight weeks of chasing people by email."
        body="Finding the right robot builder usually involves endless emails and picking whoever answers the phone first, which is rarely the best fit for your factory. Worse, every builder ends up with a slightly different description of the job, so their prices can never be compared fairly. Polyborg matches you to checked local builders instantly and sends them the exact same project plan."
        todo="Pick your industry focus and your preferred direct robot brand below. The matched list updates as you change your choices. Then select the builder you want, and send everyone the identical plan."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div>
          <Panel title="Narrow the search" icon={Users} accent="text-signal-400">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="industry-focus"
                  className="mb-2 block font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase"
                >
                  Industry focus
                </label>
                <select
                  id="industry-focus"
                  value={industry}
                  onChange={(e) => changeIndustry(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-signal-500 focus:outline-none"
                >
                  {INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="robot-brand"
                  className="mb-2 block font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase"
                >
                  Direct robot brand
                </label>
                <select
                  id="robot-brand"
                  value={brand}
                  onChange={(e) => changeBrand(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white transition-colors focus:border-teal-400 focus:outline-none"
                >
                  {ROBOT_BRANDS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  The direct robot brand or original manufacturer is the company that makes the robot
                  arm itself, rather than the local firm that installs it for you.
                </p>
              </div>

              {selectedBuilder && (
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/[0.07] p-3.5">
                  <div className="mb-1 flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-teal-400" />
                    <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-teal-400 uppercase">
                      Your choice
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {BUILDERS.find((b) => b.id === selectedBuilder)?.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuilder(null)
                      addLog('Cleared the selected robot builder.')
                    }}
                    className="mt-2 text-[11px] font-medium text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-200"
                  >
                    Clear this choice
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
                <Users className="h-4 w-4 text-teal-400" />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">
                  {matched.length} matched {matched.length === 1 ? 'builder' : 'builders'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Every one checked by Polyborg before being listed
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={sendPlan}
              disabled={matched.length === 0 || planSent}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${
                planSent
                  ? 'cursor-default border border-teal-500/40 bg-teal-500/15 text-teal-300'
                  : matched.length === 0
                    ? 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-600'
                    : 'bg-signal-600 text-white hover:bg-signal-500 focus-visible:ring-signal-400'
              }`}
            >
              {planSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Plan sent to everyone
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send identical plan to all matched builders
                </>
              )}
            </button>
          </div>

          {matched.length === 0 ? (
            <Panel>
              <div className="py-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
                <p className="mb-1 text-sm font-semibold text-white">
                  No builder matches both of those choices
                </p>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                  Try setting the robot brand back to{' '}
                  <span className="font-semibold text-slate-300">Any brand</span>, or pick a
                  different industry focus.
                </p>
              </div>
            </Panel>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {matched.map((builder) => {
                const isSelected = selectedBuilder === builder.id
                return (
                  <div
                    key={builder.id}
                    className={`fade-rise flex flex-col rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? 'border-teal-500/50 bg-teal-500/[0.07]'
                        : 'border-slate-800 bg-slate-900/70'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{builder.name}</h3>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{builder.town} area</span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full border border-teal-500/50 bg-teal-500/20 px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 text-teal-300" />
                          <span className="font-mono text-[10px] font-bold tracking-wider text-teal-200 uppercase">
                            Selected
                          </span>
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5">
                          <ShieldCheck className="h-3 w-3 text-slate-400" />
                          <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                            Checked
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-slate-400">{builder.note}</p>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {builder.brands.map((b) => (
                        <span
                          key={b}
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                            brand === b ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                      <div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-signal-400 text-signal-400" />
                          <span className="text-sm font-semibold text-white tabular-nums">
                            {builder.rating}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          From {builder.projects} finished jobs
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300">
                        <Clock className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">{builder.reply}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => choose(builder)}
                      disabled={isSelected}
                      className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${
                        isSelected
                          ? 'cursor-default border border-teal-500/40 bg-teal-500/15 text-teal-300'
                          : 'border border-slate-700 bg-slate-800 text-slate-200 hover:border-signal-500/50 hover:bg-slate-700 focus-visible:ring-signal-400'
                      }`}
                    >
                      {isSelected ? 'This is your selected builder' : 'Select this builder'}
                    </button>

                    {planSent && (
                      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-800 pt-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                        <span className="text-[11px] font-medium text-teal-300">
                          Received your project plan
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Stage three: Price
   ========================================================= */

function PriceStage({ revealHidden, setRevealHidden, notify, addLog }) {
  const rows = useMemo(
    () =>
      BIDS.map((bid) => {
        const hiddenTotal = bid.hidden.reduce((sum, h) => sum + h.amount, 0)
        return { ...bid, hiddenTotal, trueCost: bid.base + hiddenTotal }
      }),
    [],
  )

  const cheapestOnPaper = Math.min(...rows.map((r) => r.base))
  const cheapestTrue = Math.min(...rows.map((r) => r.trueCost))
  const dearestTrue = Math.max(...rows.map((r) => r.trueCost))

  const paperWinner = rows.find((r) => r.base === cheapestOnPaper)
  const trueWinner = rows.find((r) => r.trueCost === cheapestTrue)

  function toggle() {
    const next = !revealHidden
    setRevealHidden(next)
    if (next) {
      addLog('Revealed the hidden exclusions on all three builder bids.')
      notify(
        `${paperWinner.name} looked cheapest at ${money(paperWinner.base)}, but once the left out costs are added they become the most expensive. ${trueWinner.name} is the real best value.`,
        'warn',
      )
    }
  }

  return (
    <div className="fade-rise">
      <PageTitle
        step="Stage three"
        title="Price: compare the bids honestly"
        subtitle="Every builder priced the same plan. Polyborg puts all three into one identical layout, then shows you the costs each builder quietly left out."
      />

      <InfoBox
        title="This replaces about seven weeks of trying to compare prices that do not line up."
        body="Builders usually send quotes in confusing formats that hide extra costs. One includes delivery, another does not. One mentions safety fencing, another leaves it out and charges you later. Polyborg puts every bid into one identical format and reveals the hidden fees before you sign anything, so a low headline number can no longer disguise an expensive project."
        todo="Look at the three prices below as they were sent. Then turn on the switch to reveal the exclusions, and watch the cheapest looking bid turn into the most expensive one. Your switch position is saved."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              revealHidden ? 'bg-red-500/15' : 'bg-slate-800'
            }`}
          >
            {revealHidden ? (
              <Eye className="h-4 w-4 text-red-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-slate-400" />
            )}
          </span>
          <div>
            <div className="text-sm font-semibold text-white">
              Reveal hidden exclusions and true costs
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {revealHidden
                ? 'You are now seeing the full amount you would really pay.'
                : 'You are seeing the prices exactly as the builders wrote them.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          role="switch"
          aria-checked={revealHidden}
          aria-label="Reveal hidden exclusions and true costs"
          className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 ${
            revealHidden
              ? 'border-red-400/50 bg-red-500/30 focus-visible:ring-red-400'
              : 'border-slate-700 bg-slate-800 focus-visible:ring-slate-500'
          }`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full shadow-lg transition-transform ${
              revealHidden ? 'translate-x-8 bg-red-400' : 'translate-x-1 bg-slate-400'
            }`}
          />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((row) => {
          const looksCheapest = row.base === cheapestOnPaper
          const isTrueWinner = row.trueCost === cheapestTrue
          const isTrueLoser = row.trueCost === dearestTrue
          const highlight = revealHidden ? isTrueWinner : looksCheapest

          return (
            <div
              key={row.id}
              className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                highlight
                  ? 'border-teal-500/50 bg-teal-500/[0.05]'
                  : revealHidden && isTrueLoser
                    ? 'border-red-500/40 bg-red-500/[0.04]'
                    : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              <div className="border-b border-slate-800 px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{row.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {row.town} area
                    </div>
                  </div>
                  {highlight && (
                    <span className="shrink-0 rounded-full border border-teal-500/40 bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-teal-300 uppercase">
                      {revealHidden ? 'Best value' : 'Looks cheapest'}
                    </span>
                  )}
                  {revealHidden && isTrueLoser && (
                    <span className="shrink-0 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-red-300 uppercase">
                      Most expensive
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4 px-4 py-4">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                    Price as written by the builder
                  </div>
                  <div
                    className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${
                      revealHidden
                        ? 'text-slate-500 line-through decoration-red-500/60 decoration-2'
                        : 'text-white'
                    }`}
                  >
                    {money(row.base)}
                  </div>
                </div>

                <dl className="space-y-1.5 border-t border-slate-800 pt-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Time to build and switch on</dt>
                    <dd className="font-medium text-slate-300 tabular-nums">{row.weeks} weeks</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Repair cover included</dt>
                    <dd className="font-medium text-slate-300">{row.warranty}</dd>
                  </div>
                </dl>

                {revealHidden && (
                  <div className="slide-open space-y-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] p-3">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-red-300 uppercase">
                        Costs left out of the price
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {row.hidden.map((item) => (
                        <li key={item.label} className="flex items-start justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-start gap-1.5 text-slate-300">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                            <span className="leading-snug">{item.label}</span>
                          </span>
                          <span className="shrink-0 font-mono font-semibold text-red-300 tabular-nums">
                            + {money(item.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between gap-2 border-t border-red-500/25 pt-2 text-xs">
                      <span className="font-semibold text-red-200">Extra you would pay</span>
                      <span className="font-mono font-bold text-red-300 tabular-nums">
                        {money(row.hiddenTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-3.5">
                <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  True cost to you
                </div>
                <div
                  className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${
                    revealHidden
                      ? isTrueWinner
                        ? 'text-teal-300'
                        : 'text-red-400'
                      : 'text-slate-600'
                  }`}
                >
                  {revealHidden ? money(row.trueCost) : 'Hidden'}
                </div>
                {!revealHidden && (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Turn on the switch above to reveal this.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {revealHidden && (
        <div className="fade-rise mt-5">
          <Panel title="What just happened" icon={TrendingDown} accent="text-signal-400">
            <p className="text-sm leading-relaxed text-slate-300">
              {paperWinner.name} wrote the lowest number on paper at {money(paperWinner.base)}. But
              they left out {money(paperWinner.hiddenTotal)} of work you would still have to pay for,
              which pushes their real total to{' '}
              <span className="font-semibold text-red-400">{money(paperWinner.trueCost)}</span> and
              makes them the most expensive of the three.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {trueWinner.name} quoted a higher headline figure, yet once everything is counted they
              are the best value at{' '}
              <span className="font-semibold text-teal-300">{money(trueWinner.trueCost)}</span>, and
              they finish {paperWinner.weeks - trueWinner.weeks} weeks sooner with longer repair
              cover.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              This comparison normally takes a factory seven weeks of reading long documents. Here it
              took one switch.
            </p>
          </Panel>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   Stage four: Deliver and Run
   ========================================================= */

function polarPoint(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polarPoint(cx, cy, r, startDeg)
  const e = polarPoint(cx, cy, r, endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

function SpeedDial({ speed }) {
  const pct = Math.min(speed / MAX_SPEED, 1)
  const startDeg = 180
  const endDeg = startDeg + 180 * pct
  const targetDeg = startDeg + 180 * (TARGET_SPEED / MAX_SPEED)
  const tickInner = polarPoint(100, 100, 74, targetDeg)
  const tickOuter = polarPoint(100, 100, 92, targetDeg)
  const meets = speed >= TARGET_SPEED

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg
        viewBox="0 0 200 118"
        className="w-full"
        role="img"
        aria-label={`Current speed ${speed} items per minute against a target of ${TARGET_SPEED}`}
      >
        <path d={arcPath(100, 100, 83, 180, 360)} stroke="#1e293b" strokeWidth="16" fill="none" strokeLinecap="round" />
        {pct > 0.01 && (
          <path
            d={arcPath(100, 100, 83, startDeg, endDeg)}
            stroke={meets ? '#2dd4bf' : '#f59e0b'}
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />
        )}
        <line
          x1={tickInner.x}
          y1={tickInner.y}
          x2={tickOuter.x}
          y2={tickOuter.y}
          stroke="#6f9bf0"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text x="100" y="86" textAnchor="middle" fill="#ffffff" fontSize="30" fontWeight="700" className="tabular-nums">
          {speed}
        </text>
        <text x="100" y="103" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
          items per minute
        </text>
      </svg>

      <div className="mt-1 flex items-center justify-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-signal-600" />
          <span className="text-slate-400">Agreed target {TARGET_SPEED}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-sm ${meets ? 'bg-teal-400' : 'bg-amber-400'}`} />
          <span className="text-slate-400">Running now {speed}</span>
        </span>
      </div>
    </div>
  )
}

function RobotArm({ running }) {
  return (
    <div className={running ? '' : 'arm-halted'}>
      <svg
        viewBox="0 0 260 220"
        className="w-full"
        role="img"
        aria-label={running ? 'Robot arm moving boxes' : 'Robot arm stopped'}
      >
        <defs>
          <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#93b4f5" />
            <stop offset="100%" stopColor="#2b52c9" />
          </linearGradient>
        </defs>

        <line x1="0" y1="192" x2="260" y2="192" stroke="#1e293b" strokeWidth="2" />

        <rect x="4" y="160" width="72" height="12" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <g clipPath="inset(0)">
          <g className="belt-move">
            {[0, 24, 48, 72, 96].map((x) => (
              <rect key={x} x={4 + x} y="163" width="12" height="6" rx="1" fill="#334155" />
            ))}
          </g>
        </g>
        <rect x="14" y="146" width="18" height="14" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />
        <rect x="44" y="146" width="18" height="14" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />

        <rect x="176" y="180" width="72" height="10" rx="2" fill="#3f3324" stroke="#5c4832" strokeWidth="1" />
        <rect x="182" y="164" width="28" height="16" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />
        <rect x="214" y="164" width="28" height="16" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />
        <rect x="182" y="148" width="28" height="16" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />

        <rect x="70" y="168" width="44" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <rect x="78" y="156" width="28" height="14" rx="2" fill="#334155" stroke="#475569" strokeWidth="1.2" />

        <g className="arm-shoulder">
          <rect x="84" y="86" width="16" height="74" rx="7" fill="url(#armGrad)" />
          <circle cx="92" cy="156" r="9" fill="#0f172a" stroke="#6f9bf0" strokeWidth="2.5" />
          <g className="arm-elbow">
            <rect x="85" y="26" width="14" height="62" rx="6" fill="#94a3b8" />
            <circle cx="92" cy="84" r="7.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2.5" />
            <rect x="82" y="16" width="20" height="10" rx="2" fill="#475569" />
            <rect x="79" y="8" width="6" height="12" rx="1.5" fill="#64748b" />
            <rect x="99" y="8" width="6" height="12" rx="1.5" fill="#64748b" />
            {running && (
              <rect x="84" y="9" width="16" height="12" rx="2" fill="#8a6540" stroke="#b08356" strokeWidth="1" />
            )}
          </g>
        </g>

        <circle cx="92" cy="163" r="3.5" fill={running ? '#2dd4bf' : '#f59e0b'}>
          {running && (
            <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
          )}
        </circle>
      </svg>
    </div>
  )
}

function RunStage({
  robotRunning,
  setRobotRunning,
  selectedBuilder,
  simulationLogs,
  addLog,
  notify,
  goToStage,
}) {
  const [items, setItems] = useState(1284)
  const [billedMinutes, setBilledMinutes] = useState(9840)
  const [pausedMinutes, setPausedMinutes] = useState(0)

  const speed = robotRunning ? RUNNING_SPEED : 0
  const builder = BUILDERS.find((b) => b.id === selectedBuilder) || null

  useEffect(() => {
    const id = window.setInterval(() => {
      if (robotRunning) {
        setItems((n) => n + 1)
        setBilledMinutes((m) => m + 1)
      } else {
        setPausedMinutes((m) => m + 1)
      }
    }, 1400)
    return () => window.clearInterval(id)
  }, [robotRunning])

  function toggleRobot() {
    const next = !robotRunning
    setRobotRunning(next)
    if (next) {
      addLog('Robot restarted and is meeting the agreed speed. Billing resumed.')
      notify('The robot is running at the agreed speed again, so billing has restarted.')
    } else {
      addLog('Robot breakage simulated. Speed dropped to zero and billing paused automatically.')
      notify(
        'The robot has stopped, so your billing stopped at the same moment. You are never charged for down time.',
        'warn',
      )
    }
  }

  const uptime =
    billedMinutes + pausedMinutes > 0
      ? ((billedMinutes / (billedMinutes + pausedMinutes)) * 100).toFixed(1)
      : '100.0'

  return (
    <div className="fade-rise">
      <PageTitle
        step="Stage four"
        title="Deliver and run: pay only for work actually done"
        subtitle="Your robot is installed and running. You pay a regular subscription, and only for the time it genuinely hits the speed you agreed."
      />

      <InfoBox
        title="This removes the large upfront buying costs and the risk of paying for a stopped robot."
        body="Buying a robot the traditional way requires a huge upfront payment, and you keep paying for that machine even if it breaks down or runs slower than promised. Polyborg instead runs robots as a subscription service, so you only pay while the robot is actually working at the agreed speed. If it stops, the charge stops with it, automatically."
        todo="Watch the robot working and hitting its target speed. Then press the breakage button to see the billing pause by itself, at the very same moment the robot stops. This state is saved to your session."
      />

      {builder ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-teal-500/25 bg-teal-500/[0.06] px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15">
            <Building2 className="h-4 w-4 text-teal-300" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.12em] text-teal-400 uppercase">
              Installed and maintained by
            </div>
            <div className="truncate text-sm font-semibold text-white">{builder.name}</div>
          </div>
          <span className="font-mono text-[11px] text-slate-400">{builder.town} area</span>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm leading-relaxed text-amber-100">
              You have not chosen a robot builder yet. Go back to Stage two to pick the company that
              installs and maintains this machine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToStage(1)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Choose a builder
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-5">
          <Panel
            title="Live robot status"
            icon={Activity}
            accent={robotRunning ? 'text-teal-400' : 'text-amber-400'}
          >
            <div
              className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
                robotRunning
                  ? 'border-teal-500/30 bg-teal-500/[0.07]'
                  : 'border-amber-500/40 bg-amber-500/[0.09]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-2.5 w-2.5 rounded-full ${
                    robotRunning ? 'bg-teal-400' : 'amber-flash bg-amber-400'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    robotRunning ? 'text-teal-300' : 'text-amber-300'
                  }`}
                >
                  {robotRunning ? 'Running at the agreed speed' : 'Stopped, repair team notified'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">Packing line two</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              {/* Capped so the arm stays in proportion on very wide screens
                  instead of stretching to fill the whole panel. */}
              <div className="mx-auto w-full max-w-[460px]">
                <RobotArm running={robotRunning} />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleRobot}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${
                robotRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:ring-amber-400'
                  : 'bg-teal-500 text-slate-950 hover:bg-teal-400 focus-visible:ring-teal-400'
              }`}
            >
              {robotRunning ? (
                <>
                  <Pause className="h-4 w-4" /> Simulate robot breakage
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Repair and restart the robot
                </>
              )}
            </button>
          </Panel>

          <Panel title="Speed against your agreed target" icon={Gauge} accent="text-signal-400">
            <SpeedDial speed={speed} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  Agreed target
                </div>
                <div className="mt-1 text-lg font-bold text-white tabular-nums">
                  {TARGET_SPEED}{' '}
                  <span className="text-xs font-normal text-slate-500">items per minute</span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  Running right now
                </div>
                <div
                  className={`mt-1 text-lg font-bold tabular-nums ${
                    robotRunning ? 'text-teal-300' : 'text-amber-300'
                  }`}
                >
                  {speed} <span className="text-xs font-normal text-slate-500">items per minute</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel
            title="Billing status"
            icon={Wallet}
            accent={robotRunning ? 'text-teal-400' : 'text-amber-400'}
          >
            <div
              className={`rounded-lg border px-4 py-5 text-center ${
                robotRunning
                  ? 'border-teal-500/40 bg-teal-500/[0.08]'
                  : 'amber-flash border-amber-500/50 bg-amber-500/[0.12]'
              }`}
            >
              <div className="mb-2 font-mono text-[10px] tracking-[0.14em] text-slate-400 uppercase">
                Billing status
              </div>
              <div
                className={`text-xl font-bold tracking-tight ${
                  robotRunning ? 'text-teal-300' : 'text-amber-300'
                }`}
              >
                {robotRunning ? 'ACTIVE' : 'BILLING PAUSED'}
              </div>
              <p
                className={`mt-2 text-xs leading-relaxed ${
                  robotRunning ? 'text-teal-200/70' : 'text-amber-200/80'
                }`}
              >
                {robotRunning
                  ? 'The robot is meeting the agreed speed, so your regular subscription fee is running normally.'
                  : 'Performance guarantee active. You are not being charged while the robot is stopped.'}
              </p>
            </div>

            <dl className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <dt className="text-xs text-slate-400">Regular subscription fee</dt>
                <dd className="font-mono text-sm font-semibold text-white tabular-nums">
                  {money(MONTHLY_FEE)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <dt className="text-xs text-slate-400">Large upfront buying cost</dt>
                <dd className="font-mono text-sm font-semibold text-teal-300">None</dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <dt className="text-xs text-slate-400">Minutes charged for</dt>
                <dd className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                  {billedMinutes.toLocaleString('en-US')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-slate-400">Minutes not charged for</dt>
                <dd
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    pausedMinutes > 0 ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {pausedMinutes.toLocaleString('en-US')}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Since the robot was switched on" icon={Package} accent="text-slate-400">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5">
                <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  Items stacked
                </div>
                <div className="mt-1 text-xl font-bold text-white tabular-nums">
                  {items.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3.5">
                <div className="font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
                  Time at agreed speed
                </div>
                <div className="mt-1 text-xl font-bold text-teal-300 tabular-nums">
                  {uptime}%
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Simulation activity log" icon={Wrench} accent="text-slate-400">
            {simulationLogs.length === 0 ? (
              <p className="py-2 text-sm leading-relaxed text-slate-500">
                Nothing has happened yet. Every action you take across the four stages is recorded
                here, and the log survives a page refresh.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {simulationLogs.map((entry, i) => (
                  <li
                    key={`${entry.time}-${i}`}
                    className="flex items-start gap-2.5 border-b border-slate-800/70 pb-2 last:border-b-0"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-600" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed text-slate-300">{entry.message}</p>
                      <span className="font-mono text-[10px] text-slate-600">{entry.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Root application
   ========================================================= */

export default function PolyborgApp() {
  const [authEmail, setAuthEmail] = useState(() => readSession(AUTH_KEY, null))
  const [state, setState] = useState(() => {
    const stored = readSession(STATE_KEY, null)
    if (!stored) return INITIAL_STATE
    return {
      ...INITIAL_STATE,
      ...stored,
      customPriceSettings: {
        ...INITIAL_STATE.customPriceSettings,
        ...(stored.customPriceSettings || {}),
      },
      simulationLogs: Array.isArray(stored.simulationLogs) ? stored.simulationLogs : [],
    }
  })

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const mainRef = useRef(null)

  /* ---- persist workspace state on every change ---- */
  useEffect(() => {
    if (authEmail) writeSession(STATE_KEY, state)
  }, [state, authEmail])

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [state.currentStage])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    },
    [],
  )

  function notify(message, tone) {
    setToast({ message, tone })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 5400)
  }

  function addLog(message) {
    setState((prev) => ({
      ...prev,
      simulationLogs: [{ time: timeStamp(), message }, ...prev.simulationLogs].slice(0, 40),
    }))
  }

  function handleLogin(email) {
    writeSession(AUTH_KEY, email)
    setAuthEmail(email)
    const fresh = readSession(STATE_KEY, null) || INITIAL_STATE
    setState({
      ...INITIAL_STATE,
      ...fresh,
      customPriceSettings: {
        ...INITIAL_STATE.customPriceSettings,
        ...(fresh.customPriceSettings || {}),
      },
      simulationLogs: Array.isArray(fresh.simulationLogs) ? fresh.simulationLogs : [],
    })
  }

  function handleLogout() {
    clearSession(AUTH_KEY)
    clearSession(STATE_KEY)
    setAuthEmail(null)
    setState(INITIAL_STATE)
  }

  function handleReset() {
    clearSession(STATE_KEY)
    setState(INITIAL_STATE)
    notify('Application state has been reset. The four stage workflow is ready to start again.')
  }

  function goToStage(stageId) {
    setState((prev) => ({ ...prev, currentStage: stageId }))
  }

  function setScopeSpecs(specs) {
    setState((prev) => ({ ...prev, scopeSpecs: specs }))
  }

  function setSelectedBuilder(builderId) {
    setState((prev) => ({ ...prev, selectedBuilder: builderId }))
  }

  function setRevealHidden(value) {
    setState((prev) => ({ ...prev, customPriceSettings: { revealHidden: value } }))
  }

  function setRobotRunning(value) {
    setState((prev) => ({ ...prev, robotRunning: value }))
  }

  const completed = useMemo(() => {
    const list = []
    if (state.scopeSpecs) list.push('scope')
    if (state.selectedBuilder) list.push('source')
    if (state.customPriceSettings.revealHidden) list.push('price')
    if (state.simulationLogs.some((l) => l.message.includes('breakage'))) list.push('run')
    return list
  }, [state])

  if (!authEmail) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar currentStage={state.currentStage} goToStage={goToStage} completed={completed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={authEmail} onLogout={handleLogout} onReset={handleReset} />

        <main ref={mainRef} className="flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            {state.currentStage === 0 && (
              <ScopeStage
                scopeSpecs={state.scopeSpecs}
                setScopeSpecs={setScopeSpecs}
                notify={notify}
                addLog={addLog}
              />
            )}
            {state.currentStage === 1 && (
              <SourceStage
                selectedBuilder={state.selectedBuilder}
                setSelectedBuilder={setSelectedBuilder}
                notify={notify}
                addLog={addLog}
              />
            )}
            {state.currentStage === 2 && (
              <PriceStage
                revealHidden={state.customPriceSettings.revealHidden}
                setRevealHidden={setRevealHidden}
                notify={notify}
                addLog={addLog}
              />
            )}
            {state.currentStage === 3 && (
              <RunStage
                robotRunning={state.robotRunning}
                setRobotRunning={setRobotRunning}
                selectedBuilder={state.selectedBuilder}
                simulationLogs={state.simulationLogs}
                addLog={addLog}
                notify={notify}
                goToStage={goToStage}
              />
            )}
          </div>
        </main>

        <footer className="hidden border-t border-slate-800 px-6 py-4 lg:block">
          <p className="text-xs text-slate-600">
            Polyborg AI demonstration portal. All builders, prices and factory details shown here are
            examples created for this walkthrough.
          </p>
        </footer>
      </div>

      <BottomNav currentStage={state.currentStage} goToStage={goToStage} completed={completed} />
      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  )
}
