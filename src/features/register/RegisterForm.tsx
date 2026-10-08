'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { soundscape } from '@/features/sound/soundscape';
import { cn } from '@/lib/utils';
import { PRACTICE_OPTIONS, type Intent, type IntentField } from './intents';
import styles from './RegisterForm.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';
type Values = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFormProps {
  intent: Intent;
  /** Practice names, in order, for the practice selects. */
  practices: string[];
  /** Pre-selected practice name (from ?service=). */
  practice?: string;
  sourcePath: string;
  /** Called from the confirmation's "Done" button. */
  onDone?: () => void;
}

function validate(intent: Intent, v: Values) {
  const errors: Values = {};
  if ((v.name ?? '').trim().length < 2) errors.name = 'Please tell us your name.';
  if (!EMAIL.test((v.email ?? '').trim())) errors.email = 'Please enter a valid email address.';
  for (const f of intent.fields) {
    const value = (v[f.name] ?? '').trim();
    if (f.required && !value) errors[f.name] = f.type === 'select' ? 'Please choose one.' : 'Please fill this in.';
    else if (value && f.type === 'url' && !/^https?:\/\/\S+$/i.test(value)) errors[f.name] = 'Use a full link starting with https://';
  }
  if (intent.message.required && (v.message ?? '').trim().length < 10) errors.message = 'A little more detail helps (at least 10 characters).';
  return errors;
}

/** One registration form, built from the intent's field list. */
export function RegisterForm({ intent, practices, practice, sourcePath, onDone }: RegisterFormProps) {
  const [values, setValues] = useState<Values>(() => (practice ? { practice } : ({} as Values)));
  const [errors, setErrors] = useState<Values>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMessage, setServerMessage] = useState('');
  const openedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = Object.fromEntries(Object.entries(validate(intent, values)).filter(([, m]) => m));
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus('sending');
    setServerMessage('');
    const honeypot = (e.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const details = Object.fromEntries(intent.fields.map((f) => [f.name, (values[f.name] ?? '').trim()]).filter(([, v]) => v));
    try {
      const res = await fetch('/api/v1/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name?.trim(),
          email: values.email?.trim(),
          topic: intent.topic,
          intent: intent.key,
          details,
          message: values.message?.trim() ?? '',
          sourcePath,
          website: honeypot || undefined,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        soundscape?.cue('chime');
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { message?: string; details?: { path: string; message: string }[] } } | null;
      const fieldErrors: Values = {};
      body?.error?.details?.forEach((d) => {
        fieldErrors[d.path.replace(/^details\./, '')] = d.message;
      });
      setErrors(fieldErrors);
      setServerMessage(
        res.status === 429
          ? 'Too many requests in a short time. Please wait a few minutes and try again.'
          : (body?.error?.message ?? 'Something went wrong on our side. Please try again.'),
      );
      setStatus('error');
    } catch {
      setServerMessage('We could not reach the server. Check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <span className={styles.sentMark} aria-hidden="true" />
        <p className={styles.sentTitle}>Received, {values.name?.split(' ')[0]}.</p>
        <p className={styles.sentBody}>
          {intent.success} We will write to <b>{values.email}</b>.
        </p>
        {onDone && (
          <Button type="button" variant="outline" arrow={false} onClick={onDone} className={styles.done} autoFocus>
            Done
          </Button>
        )}
      </div>
    );
  }

  const field = (f: IntentField) => {
    const id = `reg-${intent.key}-${f.name}`;
    const error = errors[f.name];
    const common = {
      id,
      name: f.name,
      value: values[f.name] ?? '',
      required: f.required,
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? `${id}-error` : undefined,
      className: styles.input,
    };
    const options = f.options?.flatMap((o) => (o === PRACTICE_OPTIONS ? practices : [o]));
    return (
      <div key={f.name} className={cn(styles.field, f.half && styles.half, error && styles.fieldError)}>
        <label htmlFor={id} className={styles.label}>
          {f.label}
          {!f.required && <span className={styles.optional}> (optional)</span>}
        </label>
        {f.type === 'select' ? (
          <select {...common} className={cn(styles.input, styles.select)} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">Choose…</option>
            {options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={f.type}
            inputMode={f.type === 'number' ? 'numeric' : undefined}
            min={f.type === 'number' ? 0 : undefined}
            autoComplete={f.autoComplete ?? 'off'}
            spellCheck={f.type === 'url' || f.type === 'email' ? false : undefined}
            placeholder={f.hint}
            maxLength={f.type === 'url' ? 300 : 160}
            onChange={(e) => set(f.name, e.target.value)}
          />
        )}
        {error && (
          <p id={`${id}-error`} className={styles.errorText}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const text = (name: 'name' | 'email', label: string, type: string, autoComplete: string) => {
    const id = `reg-${intent.key}-${name}`;
    const error = errors[name];
    return (
      <div className={cn(styles.field, styles.half, error && styles.fieldError)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          spellCheck={type === 'email' ? false : undefined}
          value={values[name] ?? ''}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={styles.input}
          maxLength={type === 'email' ? 254 : 120}
          onChange={(e) => set(name, e.target.value)}
        />
        {error && (
          <p id={`${id}-error`} className={styles.errorText}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const messageId = `reg-${intent.key}-message`;
  return (
    <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-describedby={serverMessage ? `${intent.key}-status` : undefined}>
      <div className={styles.grid}>
        {text('name', 'Your name', 'text', 'name')}
        {text('email', 'Email', 'email', 'email')}
        {intent.fields.map(field)}
        <div className={cn(styles.field, errors.message && styles.fieldError)}>
          <label htmlFor={messageId} className={styles.label}>
            {intent.message.label}
            {!intent.message.required && <span className={styles.optional}> (optional)</span>}
          </label>
          <textarea
            id={messageId}
            name="message"
            rows={4}
            maxLength={4000}
            placeholder={intent.message.hint}
            value={values.message ?? ''}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
            className={cn(styles.input, styles.textarea)}
            onChange={(e) => set('message', e.target.value)}
          />
          {errors.message && (
            <p id={`${messageId}-error`} className={styles.errorText}>
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${intent.key}-website`}>Website</label>
        <input id={`${intent.key}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.footer}>
        <Button type="submit" size="lg" arrow disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : intent.cta}
        </Button>
        <p className={styles.privacy}>We use your details only to reply to this request.</p>
      </div>
      <div id={`${intent.key}-status`} className={styles.status} aria-live="polite">
        {serverMessage && <p className={styles.error}>{serverMessage}</p>}
      </div>
    </form>
  );
}
