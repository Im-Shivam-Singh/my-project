"use client";

import { useState } from "react";
import { Phone, ArrowRight, ShieldCheck, Sparkles, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const fullPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/^0+/, "")}`;

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendOtp(fullPhone);
      setDevOtp(res.devOtp);
      setStep("otp");
      toast.success("OTP sent!", {
        description: res.devOtp ? `Dev OTP: ${res.devOtp}` : undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 5) {
      toast.error("Enter the 5-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp(fullPhone, otp, name || undefined);
      login(res.user);
      toast.success(`Welcome, ${res.user.name}!`, {
        description: "You're in. Let's find a vibe.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-black">

      {/* Header / brand */}
      <div className="flex flex-1 flex-col justify-center px-6 pt-16">
        <div className="mb-8 animate-slide-up text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-400 vibe-pulse">
            <Sparkles className="h-10 w-10 text-black" />
          </div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-purple-400">
            VibeMatch
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-foreground/80">
            Find local parties. Connect with hosts. Build your night out.
          </p>
        </div>

        {/* Card — clean dark glass with yellow accent border */}
        <div
          className="animate-slide-up glass rounded-3xl border border-purple-400/40 p-6"
          style={{ animationDelay: "0.08s" }}
        >
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-purple-300">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-300/80" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-purple-300">+91</span>
                  <Input
                    inputMode="numeric"
                    autoFocus
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    className="h-12 rounded-xl border-white/10 bg-card pl-16 text-base text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-purple-300">
                  Your name <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Input
                  placeholder="What should hosts call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-card text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/25"
                />
              </div>

              <Button
                onClick={sendOtp}
                disabled={loading}
                className="h-12 w-full rounded-xl bg-purple-400 text-base font-bold text-black transition active:scale-95 hover:opacity-95"
              >
                {loading ? "Sending…" : "Send OTP"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>

              <SocialLogin />
            </div>
          ) : (
            <div className="space-y-5">
              <button
                onClick={() => setStep("phone")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Change number
              </button>

              <div className="space-y-1.5 text-center">
                <h2 className="font-display text-xl font-semibold text-purple-400">
                  Verify it's you
                </h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 5-digit code to{" "}
                  <span className="font-medium text-purple-300">{fullPhone}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={5}
                  value={otp}
                  onChange={(v) => setOtp(v)}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border border-purple-400/50 bg-white/5 font-mono text-lg font-bold text-purple-400 first:rounded-l-xl last:rounded-r-xl" />
                    <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border border-purple-400/50 bg-white/5 font-mono text-lg font-bold text-purple-400 first:rounded-l-xl last:rounded-r-xl" />
                    <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border border-purple-400/50 bg-white/5 font-mono text-lg font-bold text-purple-400 first:rounded-l-xl last:rounded-r-xl" />
                    <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border border-purple-400/50 bg-white/5 font-mono text-lg font-bold text-purple-400 first:rounded-l-xl last:rounded-r-xl" />
                    <InputOTPSlot index={4} className="h-12 w-12 rounded-xl border border-purple-400/50 bg-white/5 font-mono text-lg font-bold text-purple-400 first:rounded-l-xl last:rounded-r-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {devOtp && (
                <p className="text-center text-[11px] text-muted-foreground">
                  Dev OTP: <span className="font-mono text-purple-400">{devOtp}</span> (auto-fill in dev)
                </p>
              )}

              <Button
                onClick={verifyOtp}
                disabled={loading}
                className="h-12 w-full rounded-xl bg-purple-400 text-base font-bold text-black transition active:scale-95 hover:opacity-95"
              >
                {loading ? "Verifying…" : "Verify & Continue"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>

              <button
                onClick={sendOtp}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Didn't get it? Resend OTP
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          By continuing you agree to be respectful & follow community guidelines.
        </p>
      </div>
    </div>
  );
}

function SocialLogin() {
  return (
    <div className="space-y-3 pt-2">
      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-white/10" />
        <span className="px-3 text-[11px] text-muted-foreground">
          or continue with
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11 rounded-xl border-white/10 bg-card text-foreground transition hover:border-purple-400/60 hover:bg-purple-400/5"
          onClick={() => toast.info("Google login is UI-only for now")}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-xl border-white/10 bg-card text-foreground transition hover:border-purple-400/60 hover:bg-purple-400/5"
          onClick={() => toast.info("Instagram login is UI-only for now")}
        >
          <InstagramIcon className="mr-2 h-4 w-4" />
          Instagram
        </Button>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.46-1.7 4.28-5.5 4.28-3.31 0-6-2.74-6-6.12s2.69-6.12 6-6.12c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.96 3.55 14.7 2.5 12 2.5 6.75 2.5 2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.16-1.58H12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  // Monochrome white glyph — no multi-color gradient (Bumble: single accent).
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
