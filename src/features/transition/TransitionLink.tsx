'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { useTransitionRouter } from './TransitionProvider';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * A Next <Link> (prefetching, real href, open-in-new-tab all preserved) whose
 * plain left-clicks run through the page-transition curtain.
 */
export function TransitionLink({ href, onClick, target, ...rest }: Props) {
  const { navigate } = useTransitionRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (modified || (target && target !== '_self')) return;
    event.preventDefault();
    navigate(href);
  };

  return <Link href={href} target={target} onClick={handleClick} {...rest} />;
}
