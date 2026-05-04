"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const MAX_WORDS = 100;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const wordCount = countWords(message);
  const overLimit = wordCount > MAX_WORDS;
  const atLimit = wordCount >= MAX_WORDS;

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Please tell me your name.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "That doesn't look like a valid email.";
    if (!message.trim()) e.message = "Add a brief message.";
    else if (overLimit) e.message = `Keep it under ${MAX_WORDS} words.`;
    return e;
  }

  function handleBlur(field: keyof FieldErrors) {
    setTouched((t) => ({ ...t, [field]: true }));
    const next = validate();
    setErrors(next);
  }

  function handleMessageChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    if (countWords(next) > MAX_WORDS) return;
    setMessage(next);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setTouched({ name: true, email: true, message: true });

    if (Object.keys(next).length > 0) {
      // Focus the first invalid field (UI/UX Pro Max: focus-management)
      const first = (Object.keys(next)[0] as keyof FieldErrors);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send message.");
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTouched({});
      setErrors({});
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border border-[color:rgba(77,101,255,0.45)] rounded-2xl p-10 sm:p-12 bg-white/[0.015]"
      >
        <div className="flex items-center gap-4 mb-4">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white text-lg"
            aria-hidden
          >
            ✓
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold text-fg">
            Message sent.
          </h2>
        </div>
        <p className="text-fg-muted leading-relaxed mb-6">
          Thanks — I&apos;ll reply within a day or two. Usually much sooner.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="link-underline text-sm"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-8"
      aria-describedby={serverError ? "form-error" : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field
          id="name"
          name="name"
          label="Your name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleBlur("name")}
          error={touched.name ? errors.name : undefined}
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur("email")}
          error={touched.email ? errors.email : undefined}
          helper="I'll only use this to reply."
        />
      </div>

      <Field
        id="subject"
        name="subject"
        label="Subject"
        autoComplete="off"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        helper="Optional"
      />

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label
            htmlFor="message"
            className="text-sm font-medium text-fg"
          >
            Message{" "}
            <span className="text-fg-faint" aria-hidden>
              *
            </span>
          </label>
          <span
            className={`text-xs font-mono tabular-nums ${
              overLimit
                ? "text-red-400"
                : atLimit
                ? "text-accent"
                : "text-fg-faint"
            }`}
            aria-live="polite"
          >
            {wordCount} / {MAX_WORDS}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={message}
          onChange={handleMessageChange}
          onBlur={() => handleBlur("message")}
          placeholder="Tell me about your project, or just say hi…"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`w-full px-4 py-3 rounded-lg bg-white/[0.015] text-fg placeholder:text-fg-faint
                     border transition-colors duration-200 resize-none
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
                     ${
                       touched.message && errors.message
                         ? "border-red-400/60 focus:border-red-400"
                         : "border-subtle focus:border-[color:var(--accent)]"
                     }`}
        />
        {touched.message && errors.message && (
          <p
            id="message-error"
            role="alert"
            className="mt-2 text-xs text-red-400"
          >
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-primary min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "sending" ? (
            <>
              <span
                aria-hidden
                className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"
              />
              Sending…
            </>
          ) : (
            <>
              Send message <span aria-hidden>→</span>
            </>
          )}
        </button>

        {status === "error" && (
          <p
            id="form-error"
            role="alert"
            className="text-sm text-red-400"
          >
            {serverError}
          </p>
        )}
      </div>
    </form>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
}

function Field({ label, helper, error, id, required, ...rest }: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-fg mb-2"
      >
        {label}
        {required && (
          <span aria-hidden className="text-fg-faint ml-0.5">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        className={`w-full px-4 py-3 rounded-lg bg-white/[0.015] text-fg placeholder:text-fg-faint
                   border transition-colors duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]
                   ${
                     error
                       ? "border-red-400/60 focus:border-red-400"
                       : "border-subtle focus:border-[color:var(--accent)]"
                   }`}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-2 text-xs text-fg-faint">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
