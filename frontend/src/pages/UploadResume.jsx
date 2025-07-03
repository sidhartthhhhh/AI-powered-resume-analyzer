import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth";
import "./UploadResume.css";

// ✅ Get backend URL from .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function UploadResume() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login", {
        state: {
          from: "/upload",
          message: "Please login to access this page",
        },
      });
    }
  }, [navigate]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage({ text: "", type: "" });
    setAnalysisResults(null);
  };

  const handleJobChange = (event) => {
    setJobDescription(event.target.value);
    setAnalysisResults(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !jobDescription) {
      setMessage({
        text: "Please select a file and enter a job description.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = getAuthToken();

      if (!token) {
        navigate("/login", {
          state: {
            from: "/upload",
            message: "Session expired. Please login again.",
          },
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_description", jobDescription);

      // ✅ Step 1: Upload the resume
      const uploadResponse = await fetch(`${BASE_URL}/upload-resume/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();

        if (uploadResponse.status === 401) {
          navigate("/login", {
            state: {
              from: "/upload",
              message: "Session expired. Please login again.",
            },
          });
          return;
        }

        throw new Error(errorData.error || "Error uploading resume");
      }

      const uploadData = await uploadResponse.json();

      setMessage({
        text: "Resume uploaded successfully! Analyzing now...",
        type: "success",
      });

      // ✅ Step 2: Analyze the resume
      setIsAnalyzing(true);

      const analysisResponse = await fetch(
        `${BASE_URL}/analyze-resume/${uploadData.resume_id}/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "Error analyzing resume");
      }

      const analysisData = await analysisResponse.json();
      setAnalysisResults(analysisData.analysis);

      setMessage({
        text: "Resume analyzed successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Upload/Analysis error:", error);
      setMessage({
        text: error.message || "Error processing your resume. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "high-match";
    if (score >= 60) return "medium-match";
    return "low-match";
  };

  return (
    <div className="page upload-page">
      <div className="container">
        <div className="upload-header">
          <h1>Resume Analyzer</h1>
          <p>Upload your resume and job description to see how well they match</p>
        </div>

        <div className="form-container upload-form-container">
          {message.text && (
            <div
              className={`alert ${
                message.type === "success" ? "alert-success" : "alert-error"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="resume">Upload Resume</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <div className="file-name">
                  {file ? file.name : "No file selected"}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="job-description">Job Description</label>
              <textarea
                id="job-description"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={handleJobChange}
                rows="6"
              ></textarea>
            </div>

            <button
              type="submit"
              className={`btn btn-block ${
                isLoading || isAnalyzing ? "btn-loading" : ""
              }`}
              disabled={isLoading || isAnalyzing}
            >
              {isLoading
                ? "Uploading..."
                : isAnalyzing
                ? "Analyzing..."
                : "Analyze Resume"}
            </button>
          </form>
        </div>

        {/* Analysis Results Section */}
        {analysisResults && (
          <div className="analysis-results">
            <h2>Analysis Results</h2>

            <div className="score-container">
              <div
                className={`score-circle ${getScoreColor(
                  analysisResults.match_score
                )}`}
              >
                <span className="score-value">
                  {analysisResults.match_score}
                </span>
                <span className="score-label">Match Score</span>
              </div>
            </div>

            <div className="analysis-sections">
              <div className="analysis-section">
                <h3>Keywords Matched</h3>
                <div className="keywords-list">
                  {analysisResults.keywords_matched.length > 0 ? (
                    <ul>
                      {analysisResults.keywords_matched.map((keyword, index) => (
                        <li key={index} className="keyword matched">
                          {keyword}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">No keywords matched</p>
                  )}
                </div>
              </div>

              <div className="analysis-section">
                <h3>Missing Keywords</h3>
                <div className="keywords-list">
                  {analysisResults.missing_keywords.length > 0 ? (
                    <ul>
                      {analysisResults.missing_keywords.map((keyword, index) => (
                        <li key={index} className="keyword missing">
                          {keyword}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">No missing keywords</p>
                  )}
                </div>
              </div>
            </div>

            <div className="analysis-section recommendations">
              <h3>Recommendations</h3>
              {analysisResults.recommendations.length > 0 ? (
                <ul>
                  {analysisResults.recommendations.map((recommendation, index) => (
                    <li key={index} className="recommendation">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-items">No recommendations provided</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadResume;
