import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Apple, ArrowRight, Eye, EyeOff, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { useStore, type Role } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Wordmark } from "@/components/hb/AppShell";
import friends from "@/assets/friends-walk.jpg";
import { Postmark } from "@/components/hb/Postmark";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Welcome back — Outstagram" },
      { name: "description", content: "Sign in to Outstagram to send, track and deliver real-world moments around your city." },
      { property: "og:title", content: "Welcome back — Outstagram" },
      { property: "og:description", content: "Post less. Go somewhere. Meet someone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Field({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-sand bg-paper px-4 transition-all focus-within:border-stamp focus-within:bg-paper-raised focus-within:shadow-[0_0_0_4px_var(--stamp-soft)]">
      <Icon className="size-4 text-ink-muted group-focus-within:text-stamp" />{children}
    </div>
  );
}
const inputCls = "h-13 w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink-muted/70";

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("Signing you in…");
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, demo, setDemo } = useStore();
  const nav = useNavigate();

  const enter = (mail: string, r: Role, n?: string, msg?: string) => {
    signIn(mail, r, n);
    toast.success(msg ?? `Welcome${n ? `, ${n.split(" ")[0]}` : ""}!`);
    nav({ to: r === "admin" ? "/admin" : "/" });
  };

  const quickLogin = async (
    targetEmail: string,
    targetPassword: string,
    fallbackRole: Role,
    fallbackName: string
  ) => {
    setError("");
    setBusyText(fallbackRole === "admin" ? "Opening admin console…" : "Signing into account…");
    setBusy(true);

    try {
      const isSpecialAdmin =
        targetEmail.toLowerCase() === "nothingisspecial78@gmail.com" &&
        targetPassword === "abdu@1027";

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });

      if (!authError && authData.user) {
        let userRole: Role = isSpecialAdmin ? "admin" : fallbackRole;
        let displayName = fallbackName;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.role === "admin" || isSpecialAdmin) {
            userRole = "admin";
          } else {
            userRole = "user";
          }
          if (profile.display_name) {
            displayName = profile.display_name;
          }
        }

        if (isSpecialAdmin) {
          userRole = "admin";
        }

        enter(targetEmail, userRole, displayName, `Signed in as ${displayName}`);
        return;
      }

      if (authError) {
        console.warn("Supabase auth error during quick login:", authError);
      }
    } catch (err) {
      console.warn("Quick login fallback to local:", err);
    } finally {
      setBusy(false);
    }

    enter(targetEmail, fallbackRole, fallbackName, `Signed in as ${fallbackName}`);
  };

  const go = (r: Role = role) => {
    enter(r === "admin" ? "nothingisspecial78@gmail.com" : "sam@outstagram.app", r, undefined);
  };

  const submit = async () => {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "up" && !name.trim()) return setError("Please enter your name.");
    setError("");

    const isSpecialAdmin =
      mail.toLowerCase() === "nothingisspecial78@gmail.com" &&
      password === "abdu@1027";

    if (mode === "in") {
      setBusyText("Signing you in…");
      setBusy(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: mail,
          password: password,
        });

        if (authError) {
          setError(authError.message);
          toast.error(authError.message || "Invalid credentials. Please try again.");
          setBusy(false);
          return;
        }

        let userRole: Role = isSpecialAdmin ? "admin" : (role === "admin" ? "admin" : "user");
        let displayName = userRole === "admin" ? "Abdu Admin" : "Member";

        if (authData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.role === "admin" || isSpecialAdmin) {
              userRole = "admin";
            } else {
              userRole = "user";
            }
            if (profile.display_name) {
              displayName = profile.display_name;
            }
          }
        }

        if (isSpecialAdmin) {
          userRole = "admin";
        }

        enter(mail, userRole, displayName, `Welcome${displayName ? `, ${displayName.split(" ")[0]}` : ""}!`);
      } catch (err: any) {
        const msg = err?.message || "Failed to sign in. Please try again.";
        setError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    } else {
      // mode === "up" (Sign Up)
      setBusyText("Creating your account…");
      setBusy(true);

      try {
        const trimmedName = name.trim();
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: mail,
          password: password,
          options: {
            data: {
              display_name: trimmedName,
              role: "user",
            },
          },
        });

        if (authError) {
          setError(authError.message);
          toast.error(authError.message || "Failed to create account.");
          setBusy(false);
          return;
        }

        const user = authData?.user;
        const userRole: Role = "user";
        const rawMetaName = user?.user_metadata ? (user.user_metadata['display_name'] as string | undefined) : undefined;
        const displayName = trimmedName || rawMetaName || "Member";

        if (user) {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              display_name: displayName,
              role: "member",
            });
          } catch (pErr) {
            console.warn("Could not upsert profile:", pErr);
          }

          if (!authData.session) {
            try {
              await supabase.auth.signInWithPassword({ email: mail, password });
            } catch {}
          }
        }

        enter(mail, userRole, displayName, "Account created — welcome!");
      } catch (err: any) {
        const msg = err?.message || "An unexpected error occurred during signup.";
        setError(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={friends} alt="Three friends walking along a river at golden hour" width={1024} height={1280} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <Postmark place="Riverside walk" date="TODAY" className="absolute top-10 right-10 size-28 rounded-full bg-paper-raised/85 p-1" />
        <div className="absolute inset-x-12 bottom-12 text-paper-raised">
          <p className="font-hand text-3xl">The anti-Instagram.</p>
          <p className="mt-2 max-w-md font-serif text-5xl font-semibold leading-tight">Post less. Go somewhere. Meet someone.</p>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="absolute inset-x-0 top-0 h-60 overflow-hidden rounded-b-[2.5rem] lg:hidden"><img src={friends} alt="" width={1024} height={1280} className="size-full object-cover object-[center_35%]" /><div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper/70" /></div>
        <Postmark place="Go outside" date="TODAY" className="absolute top-36 right-6 size-24 rounded-full bg-paper-raised/90 lg:hidden" />
        <div className="relative">
          <Wordmark className="relative text-3xl lg:hidden [&_*]:text-paper-raised" />
          <h1 className="mt-40 font-serif text-3xl font-semibold text-ink lg:mt-0 lg:text-4xl">{mode === "in" ? "Welcome Back" : "Get Started"}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{mode === "in" ? "Sign in. One quest, ten postcards, then go outside." : "Create an account. No likes, no followers."}</p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => quickLogin("sam@outstagram.app", "abdu@1027", "user", "Sam Okafor")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-3 py-3 text-sm font-bold text-paper-raised shadow-paper hover:-translate-y-0.5 transition-transform"
            >
              <User className="size-4" />Demo Member (Sam Okafor)
            </button>
            <button
              type="button"
              onClick={() => quickLogin("nothingisspecial78@gmail.com", "abdu@1027", "admin", "Abdu Admin")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-stamp px-3 py-3 text-sm font-bold text-primary-foreground shadow-paper hover:-translate-y-0.5 transition-transform"
            >
              <ShieldCheck className="size-4" />Admin (nothingisspecial78@gmail.com)
            </button>
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-sand bg-paper-raised px-4 py-3">
            <span><span className="block text-sm font-bold text-ink">Enable Demo Mode</span><span className="text-xs text-ink-muted">Simulates GPS location at Riverside Cafe for testing</span></span>
            <Switch checked={demo} onCheckedChange={(v) => { setDemo(v); toast(v ? "Demo mode on" : "Demo mode off"); }} aria-label="Enable Demo Mode" />
          </label>

          <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 rounded-2xl border border-sand bg-paper p-1">
            {(["user", "admin"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                type="button"
                aria-selected={role === r}
                onClick={() => {
                  setRole(r);
                  if (r === "admin") {
                    setMode("in");
                    if (!email) setEmail("nothingisspecial78@gmail.com");
                  }
                }}
                className={cn("flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all", role === r ? "bg-paper-raised text-ink shadow-paper" : "text-ink-muted hover:text-ink")}
              >
                {r === "admin" ? <ShieldCheck className="size-4" /> : <User className="size-4" />}{r === "admin" ? "Admin" : "Member"}
              </button>
            ))}
          </div>
          {role === "admin" && <p className="mt-3 rounded-xl bg-stamp-soft px-3 py-2 text-xs text-stamp-ink">Admins review reports, approve partner offers, manage members and set daily quests. Default admin: nothingisspecial78@gmail.com</p>}
          <form className="mt-5 space-y-3.5" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {mode === "up" && <Field icon={User}><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} /></Field>}
            <Field icon={Mail}><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "admin" ? "Admin email" : "Email or phone"} className={inputCls} /></Field>
            <Field icon={Lock}>
              <input required type={show ? "text" : "password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputCls} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="text-ink-muted hover:text-ink">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </Field>
            {error && <p role="alert" className="rounded-xl bg-stamp-soft px-3 py-2 text-xs font-medium text-stamp-ink">{error}</p>}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-muted"><Checkbox defaultChecked className="data-[state=checked]:border-stamp data-[state=checked]:bg-stamp" /> Keep me signed in</label>
              <button type="button" className="font-semibold text-stamp-ink hover:underline">Forgot Password?</button>
            </div>
            <Button type="submit" disabled={busy} className="h-13 w-full rounded-2xl py-3.5 text-base font-bold shadow-postcard transition-transform hover:-translate-y-0.5">
              {busy ? "Please wait…" : role === "admin" ? "Login as Admin" : mode === "in" ? "Login" : "Get Started"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-muted"><span className="h-px flex-1 bg-sand" />or continue with<span className="h-px flex-1 bg-sand" /></div>
          <div className="grid grid-cols-2 gap-3">
            {["Google", "Apple"].map((p) => (
              <button key={p} onClick={() => go()} className="flex items-center justify-center gap-2 rounded-2xl border border-sand bg-paper-raised py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-paper">
                {p === "Google" ? <span className="font-extrabold text-sky">G</span> : <Apple className="size-4 fill-ink" />} {p}
              </button>
            ))}
          </div>
          {role === "user" && <p className="mt-6 text-center text-sm text-ink-muted">
            {mode === "in" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-bold text-ink hover:text-stamp-ink">{mode === "in" ? "Sign Up" : "Sign In"}</button>
          </p>}
          <button type="button" onClick={() => enter("guest@outstagram.app", "user", "Guest", "Exploring as guest")} className="mx-auto mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-stamp-ink">Explore as Guest <ArrowRight className="size-4" /></button>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-md transition-opacity", busy ? "opacity-100" : "pointer-events-none opacity-0")} role="status" aria-live="polite">
        <div className={cn("w-72 rounded-3xl bg-paper-raised p-6 text-center shadow-postcard transition-all", busy ? "scale-100" : "scale-90")}>
          <div className="relative mx-auto h-24 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Postmark place="Outstagram" date="HELLO" className="animate-pulse size-24" /></div>
          </div>
          <p className="mt-3 font-bold text-ink">{busyText}</p>
          <p className="text-xs text-ink-muted">{role === "admin" ? "Opening the admin console" : "Loading your journey"}</p>
        </div>
      </div>
    </div>
  );
}
