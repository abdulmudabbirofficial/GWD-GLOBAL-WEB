'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { soundscape } from '@/features/sound/soundscape';
import { cn } from '@/lib/utils';
import styles from './ContactForm.module.css';

export const TOPICS = [
  { value: 'project', label: 'A project' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'club', label: 'GWD Community' },
  { value: 'sports', label: 'GWD Sports' },
  { value: 'careers', label: 'Join the network' },
  { value: 'other', label: 'Something else' },
] as const;
type Topic = (typeof TOPICS)[number]['value'];
type Field = 'name' | 'email' | 'company' | 'topic' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'error';

interface Draft {
  name: string;
  email: string;
  company: string;
  topic: Topic;
  /** Practice slug, when the enquiry is about a project. */
  service: string;
  message: string;
}

const DRAFT_KEY = 'gwd:contact-draft';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(d: Draft): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (d.name.trim().length < 2) errors.name = 'Please tell us your name.';
  if (!EMAIL.test(d.email.trim())) errors.email = 'Please enter a valid email address.';
  if (d.message.trim().length < 10) errors.message = 'A little more detail helps (at least 10 characters).';
  return errors;
}

const readDraft = (): Partial<Draft> => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<Draft>;
  } catch {
    return {};
  }
};

/* Connectivity as an external store: re-renders only when the browser goes on/offline. */
const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};
const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

/**
 * `services` maps practice slugs to names; `?service=<slug>` preselects one.
 * `sourcePath` records which page the enquiry came from.
 */
export function ContactForm({ services, sourcePath = '/contact' }: { services: Record<string, string>; sourcePath?: string }) {
  const params = useSearchParams();
  // useSearchParams keeps this form client-rendered, so the initializer may read
  // the saved draft; the window guard keeps it safe if the page ever renders per request.
  const [draft, setDraft] = useState<Draft>(() => {
    const saved = typeof window === 'undefined' ? {} : readDraft();
    const topic = TOPICS.find((t) => t.value === params.get('topic'))?.value;
    const service = params.get('service') ?? '';
    return {
      name: '',
      email: '',
      company: '',
      topic: 'project',
      message: '',
      ...saved,
      service: services[saved.service ?? ''] ? (saved.service ?? '') : '',
      ...(topic ? { topic } : {}),
      ...(services[service] ? { service, topic: 'project' as const } : {}),
    };
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMessage, setServerMessage] = useState('');
  const online = useOnline();
  const offline = !online;
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // Keep a local draft so a refresh or dropped connection never loses a message.
  useEffect(() => {
    if (status === 'sent') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage unavailable, the form still works, it just won't remember
    }
  }, [draft, status]);

  const update = (field: Field | 'service', value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (field !== 'service' && errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (!navigator.onLine) return;
    setStatus('sending');
    setServerMessage('');
    const practice = draft.topic === 'project' ? services[draft.service] : undefined;
    const honeypot = (e.currentTarget.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    try {
      const res = await fetch('/api/v1/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          company: draft.company || undefined,
          topic: draft.topic,
          message: practice
            ? `Service: ${practice}

${draft.message}`
            : draft.message,
          sourcePath,
          website: honeypot || undefined,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        soundscape?.cue('chime');
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: { message?: string; details?: { path: string; message: string }[] } } | null;
      const fieldErrors: Partial<Record<Field, string>> = {};
      body?.error?.details?.forEach((d) => {
        if (['name', 'email', 'company', 'topic', 'message'].includes(d.path)) fieldErrors[d.path as Field] = d.message;
      });
      setErrors(fieldErrors);
      setServerMessage(
        res.status === 429
          ? 'Too many messages in a short time. Please wait a few minutes and try again.'
          : (body?.error?.message ?? 'Something went wrong on our side. Your message is saved. Please try again.'),
      );
      setStatus('error');
    } catch {
      setServerMessage('We could not reach the server. Your message is saved. Check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <span className={styles.sentMark} aria-hidden="true" />
        <h2 className={styles.sentTitle}>Message received.</h2>
        <p className={styles.sentBody}>
          Thank you, {draft.name.split(' ')[0]}. The right person at GWD will read it and reply to <b>{draft.email}</b>.
        </p>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-describedby={serverMessage ? 'contact-status' : undefined}>
      <fieldset className={styles.topics}>
        <legend className={styles.label}>What is this about?</legend>
        <div className={styles.topicList}>
          {TOPICS.map((t) => (
            <label key={t.value} className={cn(styles.topic, draft.topic === t.value && styles.topicOn)}>
              <input type="radio" name="topic" value={t.value} checked={draft.topic === t.value} onChange={() => update('topic', t.value)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.row}>
        <TextField id="name" label="Your name" value={draft.name} error={errors.name} onChange={(v) => update('name', v)} autoComplete="name" required />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={draft.email}
          error={errors.email}
          onChange={(v) => update('email', v)}
          autoComplete="email"
          required
        />
      </div>
      {draft.topic === 'project' && Object.keys(services).length > 0 && (
        <div className={styles.field}>
          <label htmlFor="contact-service" className={styles.label}>
            Which service? (optional)
          </label>
          <select
            id="contact-service"
            name="service"
            className={cn(styles.input, styles.select)}
            value={draft.service}
            onChange={(e) => update('service', e.target.value)}
          >
            <option value="">Not sure yet, help me decide</option>
            {Object.entries(services).map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      <TextField
        id="company"
        label="Company or college (optional)"
        value={draft.company}
        error={errors.company}
        onChange={(v) => update('company', v)}
        autoComplete="organization"
      />
      <TextField
        id="message"
        label="What needs to get done?"
        value={draft.message}
        error={errors.message}
        onChange={(v) => update('message', v)}
        multiline
        required
      />

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.footer}>
        <Button type="submit" size="lg" arrow disabled={status === 'sending' || offline}>
          {status === 'sending' ? 'Sending…' : status === 'error' ? 'Try again' : 'Send message'}
        </Button>
        <p className={styles.privacy}>We use your details only to reply to this message.</p>
      </div>

      <div id="contact-status" className={styles.status} aria-live="polite">
        {offline && <p className={styles.warn}>You appear to be offline. Your message is saved on this device. Send it when you are back online.</p>}
        {serverMessage && <p className={styles.error}>{serverMessage}</p>}
      </div>
    </form>
  );
}

interface TextFieldProps {
  id: Field;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  multiline?: boolean;
}

function TextField({ id, label, value, error, onChange, type = 'text', autoComplete, required, multiline }: TextFieldProps) {
  const inputId = `contact-${id}`;
  const errorId = `${inputId}-error`;
  const common = {
    id: inputId,
    name: id,
    value,
    required,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    className: styles.input,
  };
  return (
    <div className={cn(styles.field, error && styles.fieldError)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {multiline ? (
        <textarea {...common} rows={6} maxLength={4800} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} maxLength={id === 'email' ? 254 : 160} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={errorId} className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
