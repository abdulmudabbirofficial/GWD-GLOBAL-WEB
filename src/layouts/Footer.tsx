import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { LocalTime } from '@/components/ui/LocalTime';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { formatIsoDate } from '@/lib/format';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';
import { BackToTop } from './BackToTop';
import { SocialLinks } from './SocialLinks';
import styles from './Footer.module.css';

/**
 * The dark studio, one last time: a quiet invitation, the company's details
 * in small columns, then the mark with its full form, the rights line and the
 * site credit.
 */
export async function Footer() {
  const [company, copy] = await Promise.all([content.company(), siteCopy()]);
  const f = copy.doc('global.footer');
  const nav = copy.doc('global.nav').items;

  return (
    <footer className={styles.footer} data-tone="dark">
      <div className={styles.inner}>
        <div className={styles.invite}>
          <p className="chapter-label">{f.label}</p>
          <p className={styles.line}>{f.line}</p>
          <Button href={f.cta.href} size="lg">
            {f.cta.label}
          </Button>
        </div>

        <nav aria-label="Footer" className={styles.columns}>
          <div>
            <p className={styles.heading}>{f.exploreHeading}</p>
            <ul role="list">
              {nav.map((n) => (
                <li key={n.href}>
                  <TransitionLink href={n.href} className={styles.link}>
                    {n.label}
                  </TransitionLink>
                </li>
              ))}
              <li>
                <TransitionLink href="/contact" className={styles.link}>
                  Contact
                </TransitionLink>
              </li>
            </ul>
          </div>
          <div>
            <p className={styles.heading}>{f.workHeading}</p>
            <ul role="list">
              {f.work.map((w) => (
                <li key={w.label}>
                  <TransitionLink href={w.href} className={styles.link}>
                    {w.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.heading}>{f.studioHeading}</p>
            <address className={styles.text}>
              {company.legalName}
              <br />
              {company.locality}, {company.city}
              <br />
              {company.region}, {company.country}
            </address>
            <p className={styles.time}>
              <LocalTime timeZone="Asia/Kolkata" /> IST
            </p>
          </div>
          <div>
            <p className={styles.heading}>{f.registeredHeading}</p>
            <dl className={styles.legal}>
              <div>
                <dt>Incorporated</dt>
                <dd>{formatIsoDate(company.incorporatedOn)}</dd>
              </div>
              <div>
                <dt>CIN</dt>
                <dd>{company.cin}</dd>
              </div>
              <div>
                <dt>GSTIN</dt>
                <dd>{company.gstin}</dd>
              </div>
            </dl>
          </div>
        </nav>

        <div className={styles.bottom}>
          <p className={styles.sign}>
            <Logo className={styles.signLogo} title="GWD" />
            <span>{f.brandLine}</span>
          </p>
          <div className={styles.rights}>
            <p>
              © {new Date().getFullYear()} {f.rights}
            </p>
            <p>{f.credit}</p>
          </div>
          <SocialLinks social={copy.doc('global.social')} variant="inline" />
          <p className={styles.motto}>{company.motto}</p>
          <BackToTop className={styles.back} />
        </div>
      </div>
    </footer>
  );
}
