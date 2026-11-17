import { useState } from 'react';
import { products, services } from '../../data/offerings.js';
import ProductPreview from '../components/products/ProductPreview.jsx';
import DetailDialog from '../components/DetailDialog.jsx';

export default function OfferingsPage() {
  const [service, setService] = useState(null);
  return <div className="portfolio-container portfolio-page offerings-page">
    <p className="overline">OBJECTS & COLLABORATIONS</p><h1>Products & services<span className="accent-dot">.</span></h1><p className="page-intro">Digital objects to explore. Ideas we could build together.</p>
    <div className="offerings-catalog offerings-catalog--solo">
      <section aria-labelledby="products-title"><div className="offerings-section-heading"><h2 id="products-title">3D products</h2><span>01 / The collection begins</span></div>
        {products.map(product => <article className="product-card" key={product.id}>
          <ProductPreview product={product} /><div className="offering-card-copy"><p className="overline">{product.category}</p><h3>{product.title}</h3><p>{product.summary}</p><div className="offering-actions"><a className="portfolio-button" href={product.url} target="_blank" rel="noopener noreferrer">View on Gumroad ↗</a></div><p className="content-note">Purchase details and license information are on Gumroad.</p></div>
        </article>)}
      </section>
      <section className="portfolio-section" aria-labelledby="services-title"><div className="offerings-section-heading"><h2 id="services-title">Services</h2><span>Let’s explore the possibilities</span></div><p className="content-note">Scope and availability are discussed individually.</p>
        <div className="services-grid">{services.map(item => <article className="service-card" key={item.id}><button className="service-card-open" onClick={() => setService(item)} aria-label={`View ${item.title} service details`}><img src={item.image} alt="" loading="lazy"/><span className="service-card-copy"><strong>{item.title}</strong><span>{item.summary}</span><span className="portfolio-link">Explore service ↗</span></span></button></article>)}</div>
      </section>
    </div>
    {service && <DetailDialog service={service} onClose={() => setService(null)} />}
  </div>;
}
