import { useNavigate } from "react-router-dom";

const assurances = [
  { type: "truck", title: "Free Insured Shipping", text: "On orders above ₹4,999" },
  { type: "return", title: "Easy Returns", text: "15 days return policy" },
  { type: "lock", title: "Secure Payments", text: "100% safe & secure" },
  { type: "exchange", title: "Lifetime Exchange", text: "On gold jewellery" },
  { type: "medal", title: "BIS Hallmarked", text: "100% Certified Jewellery" },
];

const footerColumns = [
  {
    title: "Shop",
    links: [
      ["Gold Jewellery", "/collection/all?metal=gold"],
      ["Silver Jewellery", "/collection/all?metal=silver"],
      ["Collections", "/collection/all"],
      ["New In", "/collection/all?new=true"],
      ["Best Sellers", "/collection/all?bestseller=true"],
      ["Gift Cards", "/collection/all"],
    ],
  },
  {
    title: "Customer Service",
    links: [
      ["Track Order", "/order-summary"],
      ["Shipping & Delivery", "/collection/all"],
      ["Returns & Refunds", "/collection/all"],
      ["FAQs", "/collection/all"],
      ["Contact Us", "/collection/all"],
    ],
  },
  {
    title: "About Us",
    links: [
      ["Our Story", "/collection/all"],
      ["Why Choose Us", "/collection/all"],
      ["BIS Certificate", "/collection/all"],
      ["Care Guide", "/collection/all"],
      ["Store Locator", "/collection/all"],
    ],
  },
];

function AssuranceIcon({ type }) {
  const props = {
    width: 28,
    height: 28,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "truck") return <svg {...props}><path d="M3 8h16v13H3z" /><path d="M19 13h5l5 5v3H19z" /><circle cx="9" cy="24" r="3" /><circle cx="24" cy="24" r="3" /></svg>;
  if (type === "return") return <svg {...props}><rect x="4" y="4" width="24" height="24" rx="5" /><path d="m13 11-5 5 5 5" /><path d="M9 16h9a5 5 0 0 0 0-10" /></svg>;
  if (type === "lock") return <svg {...props}><rect x="7" y="13" width="18" height="15" rx="2" /><path d="M11 13V9a5 5 0 0 1 10 0v4" /><path d="M16 19v4" /></svg>;
  if (type === "exchange") return <svg {...props}><rect x="4" y="4" width="24" height="24" rx="5" /><path d="m10 12 3-3 3 3" /><path d="M13 9v10a4 4 0 0 0 4 4" /><path d="m22 20-3 3-3-3" /><path d="M19 23V13a4 4 0 0 0-4-4" /></svg>;
  return <svg {...props}><path d="m11 3 5 7 5-7 3 7-8 5-8-5z" /><circle cx="16" cy="21" r="7" /><path d="m16 17 1.3 2.6 2.7.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.7-.4z" /></svg>;
}

function ContactIcon({ type }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (type === "phone") return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>;
  if (type === "mail") return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></svg>;
  return <svg {...props}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

export default function CustomerFooter() {
  const navigate = useNavigate();

  const goTo = (path) => {
    navigate(path);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  return (
    <footer className="reference-footer">
      <style>{`
        @keyframes rfFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes rfIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes rfGoldSweep {
          from { transform: translateX(-130%) skewX(-18deg); }
          to { transform: translateX(130%) skewX(-18deg); }
        }

        .reference-footer {
          width: 100%;
          color: #fff;
          background: #073b3f;
          font-family: "Montserrat", Arial, sans-serif;
          box-sizing: border-box;
          overflow: hidden;
        }
        .reference-footer * { box-sizing: border-box; }
        .rf-assurances {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          background: #fdfdfc;
          border-top: 1px solid #e7edec;
          border-bottom: 1px solid #d1dfde;
          color: #073b3f;
        }
        .rf-assurance {
          position: relative;
          overflow: hidden;
          min-width: 0;
          min-height: 104px;
          padding: 20px clamp(16px, 2.6vw, 48px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          border-right: 1px solid #e7edec;
          animation: rfFadeUp 560ms ease both;
          transition: background .22s ease, transform .22s ease, box-shadow .22s ease;
        }

        .rf-assurance::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 38%;
          background: linear-gradient(90deg, transparent, rgba(204,168,129,.22), transparent);
          transform: translateX(-130%) skewX(-18deg);
          pointer-events: none;
        }

        .rf-assurance:hover {
          background: #f8fbfa;
          transform: translateY(-4px);
          box-shadow: 0 18px 42px rgba(7,59,63,.1);
        }

        .rf-assurance:hover::after {
          animation: rfGoldSweep .8s ease;
        }

        .rf-assurance:last-child { border-right: 0; }
        .rf-assurance-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          color: #0c4044;
          transition: transform .24s ease, color .24s ease;
        }

        .rf-assurance:hover .rf-assurance-icon {
          animation: rfIconFloat 1.1s ease-in-out infinite;
        }
        .rf-assurance:nth-child(1) .rf-assurance-icon { color: #e5a018; }
        .rf-assurance:nth-child(2) .rf-assurance-icon,
        .rf-assurance:nth-child(4) .rf-assurance-icon { color: #387bc6; }
        .rf-assurance:nth-child(3) .rf-assurance-icon,
        .rf-assurance:nth-child(5) .rf-assurance-icon { color: #bb8958; }
        .rf-assurance strong {
          display: block;
          color: #073b3f;
          font-size: clamp(13px, .95vw, 16px);
          font-weight: 800;
          line-height: 1.3;
          white-space: nowrap;
        }
        .rf-assurance span {
          display: block;
          margin-top: 6px;
          color: #7a8987;
          font-size: clamp(11px, .78vw, 14px);
          line-height: 1.4;
          white-space: nowrap;
        }
        .rf-main {
          width: 100%;
          padding: 54px clamp(36px, 4vw, 76px) 48px;
          display: grid;
          grid-template-columns: 1.35fr .9fr 1fr .9fr 1.15fr;
          gap: clamp(38px, 5vw, 92px);
          background: #073b3f;
        }

        .rf-brand,
        .rf-column,
        .rf-contact {
          animation: rfFadeUp 620ms ease both;
        }
        .rf-brand-name {
          font-family: Georgia, "Times New Roman", serif;
          color: #fdfdfc;
          font-size: clamp(28px, 2vw, 34px);
          font-weight: 700;
          letter-spacing: 3px;
          line-height: 1;
        }
        .rf-brand-sub {
          margin-top: 5px;
          color: rgba(255,255,255,.62);
          font-size: clamp(9px, .65vw, 11px);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .rf-tagline {
          margin: 25px 0 18px;
          color: rgba(255,255,255,.58);
          font-size: clamp(11px, .76vw, 13px);
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .rf-socials { display: flex; gap: 10px; }
        .rf-social {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.84);
          background: transparent;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: color .2s ease, background .2s ease, transform .2s ease, box-shadow .2s ease;
        }
        .rf-social:hover {
          color: #073b3f;
          background: #fdfdfc;
          transform: translateY(-4px) rotate(-6deg);
          box-shadow: 0 12px 24px rgba(0,0,0,.18);
        }
        .rf-heading {
          margin: 4px 0 22px;
          color: rgba(255,255,255,.58);
          font-size: clamp(12px, .82vw, 14px);
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .rf-link {
          position: relative;
          display: block;
          padding: 0;
          margin: 0 0 12px;
          border: 0;
          background: none;
          color: rgba(255,255,255,.72);
          font: 500 clamp(13px, .9vw, 15px)/1.4 "Montserrat", Arial, sans-serif;
          text-align: left;
          cursor: pointer;
          transition: color .18s ease, transform .18s ease;
        }
        .rf-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 100%;
          height: 1px;
          background: #cca881;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .22s ease;
        }
        .rf-link:hover {
          color: #fdfdfc;
          transform: translateX(5px);
        }
        .rf-link:hover::after { transform: scaleX(1); }
        .rf-contact-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 15px;
          color: rgba(255,255,255,.72);
          font-size: clamp(13px, .9vw, 15px);
          line-height: 1.65;
          transition: transform .18s ease, color .18s ease;
        }
        .rf-contact-row:hover {
          transform: translateX(4px);
          color: rgba(255,255,255,.9);
        }
        .rf-contact-row svg {
          margin-top: 1px;
          flex: 0 0 auto;
          color: #cca881;
          transition: transform .18s ease;
        }
        .rf-contact-row:hover svg { transform: scale(1.12); }
        .rf-contact-row a { color: inherit; text-decoration: none; }
        .rf-bottom {
          min-height: 52px;
          padding: 14px clamp(36px, 4vw, 76px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,.11);
          background: #062f33;
          color: rgba(255,255,255,.48);
          font-size: clamp(11px, .72vw, 13px);
        }
        .rf-payments { display: flex; align-items: center; gap: 8px; }
        .rf-payment { color: rgba(255,255,255,.82); font-weight: 800; letter-spacing: .3px; }
        .rf-payment {
          display: inline-flex;
          transition: color .18s ease, transform .18s ease;
        }
        .rf-payment:hover {
          color: #fdfdfc;
          transform: translateY(-2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .rf-assurance,
          .rf-brand,
          .rf-column,
          .rf-contact,
          .rf-social,
          .rf-link,
          .rf-contact-row,
          .rf-payment,
          .rf-assurance-icon {
            animation: none !important;
            transition: none !important;
          }
        }
        @media (max-width: 1100px) {
          .rf-assurances { grid-template-columns: repeat(3, 1fr); }
          .rf-assurance:nth-child(3) { border-right: 0; }
          .rf-assurance:nth-child(-n+3) { border-bottom: 1px solid #e7edec; }
          .rf-main { grid-template-columns: 1.25fr repeat(3, 1fr); }
          .rf-contact { grid-column: 1 / -1; }
        }
        @media (max-width: 760px) {
          .rf-assurances { grid-template-columns: 1fr 1fr; }
          .rf-assurance { min-height: 82px; justify-content: flex-start; padding: 15px 18px; }
          .rf-assurance:nth-child(odd) { border-right: 1px solid #e7edec; }
          .rf-assurance:nth-child(even) { border-right: 0; }
          .rf-assurance:nth-child(-n+4) { border-bottom: 1px solid #e7edec; }
          .rf-assurance strong { white-space: normal; font-size: 13px; }
          .rf-assurance span { white-space: normal; font-size: 11px; }
          .rf-main { grid-template-columns: 1fr 1fr; padding: 38px 22px; gap: 38px 28px; }
          .rf-brand, .rf-contact { grid-column: 1 / -1; }
          .rf-heading { font-size: 12px; margin-bottom: 18px; }
          .rf-link { font-size: 13px; margin-bottom: 11px; }
          .rf-contact-row { font-size: 13px; }
        }
        @media (max-width: 460px) {
          .rf-assurance-icon { width: 28px; }
          .rf-assurance { gap: 10px; padding: 14px 12px; }
          .rf-assurance strong { font-size: 12px; }
          .rf-assurance span { display: block; font-size: 10px; margin-top: 3px; }
          .rf-main { grid-template-columns: 1fr 1fr; gap: 34px 18px; }
          .rf-brand-name { font-size: 28px; }
          .rf-tagline { font-size: 11px; }
          .rf-link { font-size: 12px; }
          .rf-bottom { padding-left: 22px; padding-right: 22px; }
        }
      `}</style>

      <div className="rf-assurances">
        {assurances.map((item, index) => (
          <div className="rf-assurance" key={item.title} style={{ animationDelay: `${index * 70}ms` }}>
            <div className="rf-assurance-icon"><AssuranceIcon type={item.type} /></div>
            <div><strong>{item.title}</strong><span>{item.text}</span></div>
          </div>
        ))}
      </div>

      <div className="rf-main">
        <section className="rf-brand" style={{ animationDelay: "80ms" }}>
          <div className="rf-brand-name">ATHIRAI</div>
          <div className="rf-brand-sub">Where fashion meets luxury</div>
          <p className="rf-tagline">Shine. Crafted for generations.</p>
          <div className="rf-socials">
            <a className="rf-social" href="https://facebook.com" aria-label="Facebook">f</a>
            <a className="rf-social" href="https://instagram.com" aria-label="Instagram">◎</a>
            <a className="rf-social" href="https://pinterest.com" aria-label="Pinterest">p</a>
            <a className="rf-social" href="https://youtube.com" aria-label="YouTube">▶</a>
          </div>
        </section>

        {footerColumns.map((column, index) => (
          <section className="rf-column" key={column.title} style={{ animationDelay: `${160 + index * 80}ms` }}>
            <h3 className="rf-heading">{column.title}</h3>
            {column.links.map(([label, path]) => (
              <button className="rf-link" type="button" key={label} onClick={() => goTo(path)}>{label}</button>
            ))}
          </section>
        ))}

        <section className="rf-contact" style={{ animationDelay: "420ms" }}>
          <h3 className="rf-heading">Contact Us</h3>
          <div className="rf-contact-row"><ContactIcon type="phone" /><a href="tel:+916385257541">+91 63852 57541</a></div>
          <div className="rf-contact-row"><ContactIcon type="mail" /><a href="mailto:Athirai@gmail.com">Athirai@gmail.com</a></div>
          <div className="rf-contact-row"><ContactIcon type="location" /><span>44 Annai Indhira Nagar,<br />Ammapet, Salem 636003,<br />Tamil Nadu, India</span></div>
        </section>
      </div>

      <div className="rf-bottom">
        <span>© {new Date().getFullYear()} Athirai Jewellery. All Rights Reserved.</span>
        <div className="rf-payments">
          <span>We accept:</span>
          {["VISA", "Mastercard", "UPI", "Paytm"].map((item) => <span className="rf-payment" key={item}>{item}</span>)}
        </div>
      </div>
    </footer>
  );
}
