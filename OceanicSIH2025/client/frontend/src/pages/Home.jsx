import { useState } from "react"

export default function Home() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      q: "Who can use Oceara?",
      a: "Researchers, students, and organizations interested in marine datasets."
    },
    {
      q: "Is the data free to access?",
      a: "Yes, the platform provides open access to marine and fisheries data."
    },
    {
      q: "How often is the data updated?",
      a: "Datasets are refreshed periodically as new information becomes available."
    }
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #0f172a, #0b3b2f)",
        color: "#fff",
        fontFamily: "'Segoe UI', sans-serif",
        margin: 0, // ✅ remove gaps
        padding: 0  // ✅ remove gaps
      }}
    >

      {/* ✅ Hero Section with Background Image & Overlay */}
      <main className="hero-section">
        <div className="hero-overlay"></div> {/* dark gradient overlay */}
        <div className="hero-content">
          <h1 className="hero-title">🌊 Welcome to Oceara</h1>
          <p className="hero-subtext">
            Explore ocean data, fisheries, taxonomy, and marine records all in one place. 
            A unified platform by CMLRE for managing, visualising and integrating 
            multidisciplinary marine datasets to support research, conservation 
            and the blue economy.
          </p>

          {/* ✅ Call to Action */}
          <div className="cta-wrapper">
            <h2 className="cta-heading">Ready to Dive Deeper?</h2>
            <p className="cta-text">
              Start exploring the dashboard to access datasets, analysis tools, and visualizations.
            </p>
            <a href="/dashboard" className="cta-button">
              Go to Dashboard →
            </a>
          </div>
        </div>
      </main>

      {/* ✅ Services Section */}
      <section className="section">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtext">
          Discover the wide range of tools and resources we offer to the marine research community.
        </p>
        <div className="services-grid">
          <div style={cardStyle} className="service-card">
            <h3>📊 Data Records</h3>
            <p>Access structured datasets for fisheries, marine life, and ocean parameters.</p>
          </div>
          <div style={cardStyle} className="service-card">
            <h3>🔬 Taxonomy</h3>
            <p>Explore species classification and taxonomy details with integrated datasets.</p>
          </div>
          <div style={cardStyle} className="service-card">
            <h3>🌐 OBIS Records</h3>
            <p>View global biodiversity data synced with OBIS for marine organisms.</p>
          </div>
          <div style={cardStyle} className="service-card">
            <h3>🌊 Marine Data</h3>
            <p>Explore oceanographic parameters and environmental datasets for marine studies.</p>
          </div>
        </div>
      </section>

      {/* ✅ FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-item"
              onClick={() => toggleFAQ(index)}
            >
              <p className="faq-question">❓ {faq.q}</p>
              {openIndex === index && (
                <p className="faq-answer">✔ {faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <style>{`
        /* ✅ Hero section full height without gaps */
        .hero-section {
          position: relative;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background-image: url('/images/hero-bg.jpg');
          background-size: cover;
          background-position: center;
          margin: 0;
        }

        /* Overlay for readability */
        .hero-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom right, rgba(0,0,0,0.5), rgba(0,0,0,0.6));
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 850px;
          padding: 20px;
          color: #fefefe;
          animation: fadeInUp 1.2s ease-out;
        }

        .hero-title {
          font-size: 3.2rem;
          margin-bottom: 1.2rem;
          text-shadow: 2px 2px 12px rgba(0,0,0,0.7);
        }

        .hero-subtext {
          font-size: 1.2rem;
          line-height: 1.7;
          margin-bottom: 2rem;
          color: #f1f5f9;
        }

        .cta-wrapper {
          margin-top: 4rem;
        }
        .cta-heading {
          font-size: 1.8rem;
          margin-bottom: 0.8rem;
        }
        .cta-text {
          font-size: 1.1rem;
          max-width: 650px;
          margin: 0 auto 1.5rem;
          color: #e2e8f0;
        }

        .cta-button {
          display: inline-block;
          padding: 14px 32px;
          background: #16a34a;
          color: #fff;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
          animation: pulse 2.5s infinite;
        }
        .cta-button:hover {
          background: #22c55e;
          transform: scale(1.07);
          box-shadow: 0 10px 24px rgba(0,0,0,0.45);
        }

        /* Pulse animation */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* Fade in for hero content */
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Sections styling */
        .section {
          padding: 80px 20px;
          text-align: center;
        }
        .section-title {
          font-size: 2rem;
          margin-bottom: 1.4rem;
        }
        .section-subtext {
          font-size: 1.1rem;
          max-width: 800px;
          margin: 0 auto 50px;
          line-height: 1.6;
          color: #e5e7eb;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* FAQ section */
        .faq-section {
          padding: 80px 20px;
          background: rgba(255,255,255,0.05);
          text-align: center;
        }
        .faq-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: left;
        }
        .faq-item {
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .faq-item:hover {
          transform: translateX(4px);
        }
        .faq-question {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .faq-answer {
          margin-top: 6px;
          line-height: 1.6;
          color: #d1d5db;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.2rem;
          }
          .hero-subtext {
            font-size: 1rem;
          }
          .cta-heading {
            font-size: 1.4rem;
          }
          .cta-text {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  )
}

const cardStyle = {
    background: "rgba(255,255,255,0.05)",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
  minHeight: "160px"
}

{/* ✅ Inline hover styles */}
<style>{`
     /* Service Cards */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .service-card {
          opacity: 0;
          transform: translateY(40px);
        }
        .card-animate {
          animation: cardFadeIn 0.8s forwards;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .service-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .service-card:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          background: rgba(255,255,255,0.15);
        }

      `}</style>