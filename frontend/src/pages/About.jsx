import "./About.css";

function About() {
  return (
    <div className="page about-page">
      <div className="container">
        <div className="about-header">
          <h1>About ResumeMatch</h1>
          <p className="lead">
            We're on a mission to help job seekers optimize their resumes and land their dream jobs.
          </p>
        </div>
        
        <div className="about-content">
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              ResumeMatch was founded in 2023 by a team of HR professionals, data scientists, and software engineers who saw a gap in the job application process. Many qualified candidates were being filtered out by ATS (Applicant Tracking Systems) simply because their resumes didn't contain the right keywords or format.
            </p>
            <p>
              We built ResumeMatch to level the playing field and help job seekers present their skills and experience in a way that resonates with both automated systems and human recruiters.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Our Technology</h2>
            <p>
              ResumeMatch uses advanced natural language processing and machine learning algorithms to analyze resumes against job descriptions. Our system identifies:
            </p>
            <ul className="feature-list">
              <li>Keyword matches and gaps</li>
              <li>Skills alignment</li>
              <li>Experience relevance</li>
              <li>Education requirements</li>
              <li>Resume formatting and structure</li>
            </ul>
            <p>
              All analysis is performed securely in real-time, and we never store your resume content without permission.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Our Team</h2>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-avatar">JS</div>
                <h3>John Smith</h3>
                <p>CEO & Co-founder</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">AL</div>
                <h3>Amanda Lee</h3>
                <p>CTO & Co-founder</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">MR</div>
                <h3>Michael Rodriguez</h3>
                <p>Head of HR Partnerships</p>
              </div>
              <div className="team-member">
                <div className="member-avatar">KT</div>
                <h3>Kira Tanaka</h3>
                <p>Lead Data Scientist</p>
              </div>
            </div>
          </section>
          
          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <h3>Accessibility</h3>
                <p>We believe career advancement tools should be available to everyone, regardless of background or resources.</p>
              </div>
              <div className="value-card">
                <h3>Transparency</h3>
                <p>We're open about how our algorithms work and what factors influence your match score.</p>
              </div>
              <div className="value-card">
                <h3>Privacy</h3>
                <p>Your data belongs to you. We use stringent security measures and never sell your information.</p>
              </div>
              <div className="value-card">
                <h3>Continuous Improvement</h3>
                <p>We're constantly refining our technology to provide more accurate and helpful insights.</p>
              </div>
            </div>
          </section>
          
          <section className="about-section contact-section">
            <h2>Contact Us</h2>
            <p>
              Have questions or feedback? We'd love to hear from you!
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <strong>Email:</strong> support@resumematch.com
              </div>
              <div className="contact-item">
                <strong>Address:</strong> 123 Career Street, San Francisco, CA 94103
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default About;