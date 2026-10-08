import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { cn } from '@/lib/utils';
import styles from './Button.module.css';

type Variant = 'primary' | 'outline' | 'ghost';

interface BaseProps {
  children: ReactNode;
  /** primary: the one action per view · outline: glass, secondary · ghost: inline text link. */
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Show the trailing arrow (default true for links). */
  arrow?: boolean;
}

type LinkProps = BaseProps & { href: string; external?: boolean };
type NativeButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };

function Arrow() {
  return (
    <span className={styles.icon} aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
      </svg>
      <svg viewBox="0 0 16 16" className={styles.iconNext}>
        <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
      </svg>
    </span>
  );
}

/** The label rolls up to a second copy on hover (text stays one accessible string). */
function Label({ children }: { children: ReactNode }) {
  const text = typeof children === 'string' ? children : undefined;
  return (
    <span className={styles.label}>
      <span className={styles.roll} data-text={text}>
        {children}
      </span>
    </span>
  );
}

/** Pill button: a rolling label and an arrow chip that travels out and back in on hover. */
export function Button(props: LinkProps | NativeButtonProps) {
  const { children, variant = 'primary', size = 'md', className } = props;

  if (props.href !== undefined) {
    const arrow = props.arrow ?? true;
    const classes = cn(styles.button, styles[variant], styles[size], arrow && styles.withIcon, className);
    const content = (
      <>
        <Label>{children}</Label>
        {arrow && <Arrow />}
      </>
    );
    if (props.external) {
      return (
        <a href={props.href} className={classes} target="_blank" rel="noopener noreferrer" data-cta="">
          {content}
        </a>
      );
    }
    return (
      <TransitionLink href={props.href} className={classes} data-cta="">
        {content}
      </TransitionLink>
    );
  }

  const { variant: _v, size: _s, className: _c, arrow = false, children: _ch, ...rest } = props;
  return (
    <button type="button" className={cn(styles.button, styles[variant], styles[size], arrow && styles.withIcon, className)} data-cta="" {...rest}>
      <Label>{children}</Label>
      {arrow && <Arrow />}
    </button>
  );
}
