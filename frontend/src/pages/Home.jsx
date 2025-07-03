import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="page home-page">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Match Your Resume to Your Dream Job</h1>
            <p className="hero-subtitle">
              Our AI-powered tool analyzes your resume against job descriptions to maximize your chances of landing interviews.
            </p>
            <div className="hero-buttons">
              <Link to="/upload" className="btn btn-primary">
                Analyze My Resume
              </Link>
              <Link to="/about" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Upload Resume</h3>
              <p>Upload your resume in PDF, DOC, or DOCX format.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Add Job Description</h3>
              <p>Paste the job description you're interested in applying for.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Get Analysis</h3>
              <p>Our AI compares your resume to the job requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Improve Match</h3>
              <p>Receive suggestions to better align your resume with the job.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Thanks to this tool, I was able to tailor my resume perfectly for each application. I got three interview calls in a week!"
              </p>
              <div className="testimonial-author">
                <p className="author-name">Sarah J.</p>
                <p className="author-title">Marketing Professional</p>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "The keyword analysis helped me understand what recruiters were looking for. My application success rate improved dramatically."
              </p>
              <div className="testimonial-author">
                <p className="author-name">Michael T.</p>
                <p className="author-title">Software Engineer</p>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "As a career coach, I recommend this tool to all my clients. It takes the guesswork out of resume optimization."
              </p>
              <div className="testimonial-author">
                <p className="author-name">Lisa R.</p>
                <p className="author-title">Career Coach</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Land Your Dream Job?</h2>
            <p>Start analyzing your resume today. No credit card required.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Sign Up for Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;