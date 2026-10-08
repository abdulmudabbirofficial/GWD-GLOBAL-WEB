import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/experience/kit/PageShell';
import { ProductLaunch } from '@/experience/products/ProductLaunch';
import { STATUS_LABEL } from '@/lib/products';
import { PRODUCT_RENDER } from '@/lib/renders';
import { pageMetadata } from '@/lib/seo';
import { fill } from '@/content/copy/fill';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';
import styles from './products.module.css';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('products.seo');
  return pageMetadata({ title, description, path: '/products' });
}

/*
 * Products is the hall: a long dark gallery you walk down as you scroll,
 * with each product launched in turn (a red scan reveals it, its features
 * pin out from its diorama).
 */
export default async function ProductsPage() {
  const [products, c] = await Promise.all([content.products(), siteCopy()]);
  const hero = c.doc('products.hero');
  const actions = c.doc('products.actions');
  const close = c.doc('products.close');

  return (
    <PageShell world="products" tone="dark">
      <section className={styles.hero} aria-labelledby="products-title">
        <div className={`container ${styles.heroInner}`}>
          <p className="chapter-label">{hero.label}</p>
          <h1 id="products-title" className={styles.title}>
            {hero.title}
            <br />
            <span>{hero.titleSecond}</span>
          </h1>
          <p className={`t-lead ${styles.lead}`}>{hero.lead}</p>
          <span className={styles.cue} aria-hidden="true" />
        </div>
      </section>

      {products.map((p, i) => (
        <ProductLaunch
          key={p.slug}
          p={{
            slug: p.slug,
            index: i,
            last: i === products.length - 1,
            name: p.name,
            category: p.category,
            status: STATUS_LABEL[p.status],
            tagline: p.tagline,
            description: p.description,
            features: p.features,
            render: PRODUCT_RENDER[p.slug],
            actions: p.href
              ? [
                  { label: fill(actions.explore, { name: p.name }), href: p.href },
                  { label: fill(actions.demo.label, { name: p.name }), href: actions.demo.href, variant: 'outline' },
                ]
              : [{ label: fill(actions.ask.label, { name: p.name }), href: actions.ask.href, variant: 'outline' }],
          }}
        />
      ))}

      <section className={styles.close} aria-labelledby="products-close">
        <div className="container">
          <h2 id="products-close" className={styles.closeTitle}>
            {close.title}
          </h2>
          <p className="t-lead">{close.lead}</p>
          <div className={styles.closeActions}>
            <Button href={close.primary.href}>{close.primary.label}</Button>
            <Button href={close.secondary.href} variant="outline">
              {close.secondary.label}
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
