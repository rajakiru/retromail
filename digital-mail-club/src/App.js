import React, { useState, useEffect } from 'react';

// Simple routing hook
const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
  };
  
  const getParam = (name) => {
    const params = new URLSearchParams(currentPath.split('?')[1]);
    return params.get(name);
  };
  
  return { currentPath, navigate, getParam };
};

// Envelope component with animation
const Envelope = ({ onClick, isOpening = false, hasLetter = true }) => {
  return (
    <div 
      className={`envelope ${isOpening ? 'opening' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex="0"
    >
      <div className="envelope-front">
        <div className="postage-area"></div>
        <div className="addressee">To: You</div>
      </div>
      <div className="envelope-flap"></div>
      <div className="wax-seal"></div>
      {hasLetter && <div className="unread-badge">1</div>}
    </div>
  );
};

// Home page with centered envelope
const HomePage = () => {
  const [showLetter, setShowLetter] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { navigate } = useRouter();

  const handleEnvelopeClick = () => {
    setIsOpening(true);
    setTimeout(() => {
      setShowLetter(true);
    }, 900);
  };

  const closeLetter = () => {
    setShowLetter(false);
    setIsOpening(false);
  };

  if (showLetter) {
    return (
      <div className="letter-view">
        <div className="letter-card">
          <div className="letter-meta">
            <div>From: <strong>Anonymous Friend</strong></div>
            <div>Today</div>
          </div>
          <h3>Welcome to Digital Mail Club!</h3>
          <div className="letter-body">
            Dear Friend,<br/><br/>
            Welcome to our cozy corner of the internet! This is your digital mailbox where handwritten letters meet modern magic.<br/><br/>
            Click "Write New" to compose your first letter, or share a letter code to read messages from friends.<br/><br/>
            Happy letter writing!<br/><br/>
            ✨ The Mail Club
          </div>
          <div className="letter-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/write')}>
              Write New
            </button>
            <button className="btn btn-primary" onClick={closeLetter}>
              Close Letter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mailbox">
      <Envelope onClick={handleEnvelopeClick} isOpening={isOpening} />
      <div className="nav-buttons">
        <a href="#/write" className="btn btn-primary">Write New</a>
        <a href="#/view" className="btn btn-secondary">Read by Code</a>
      </div>
    </div>
  );
};

// Write letter page
const WritePage = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);

  const generateCode = () => {
    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36).toUpperCase()
    ).join('');
  };

  const handleSend = () => {
    if (!subject.trim() || !content.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    const code = generateCode();
    const letter = {
      subject: subject.trim(),
      content: content.trim(),
      dateCreated: new Date().toISOString(),
      id: Date.now()
    };

    // Store in localStorage
    localStorage.setItem(`letter_${code}`, JSON.stringify(letter));
    setGeneratedCode(code);
  };

  const resetForm = () => {
    setSubject('');
    setContent('');
    setGeneratedCode(null);
  };

  if (generatedCode) {
    return (
      <div className="write-form">
        <h2>✨ Letter Sealed & Sent!</h2>
        <div className="success-message">
          <div className="code-display">
            <p>Your letter code is:</p>
            <div className="generated-code">{generatedCode}</div>
            <p>Share this code with your recipient!</p>
          </div>
          <div className="share-link">
            <p>Or share this direct link:</p>
            <input 
              type="text" 
              value={`${window.location.origin}${window.location.pathname}#/view?code=${generatedCode}`}
              readOnly
              className="link-input"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="nav-buttons">
            <button className="btn btn-primary" onClick={resetForm}>
              Write Another
            </button>
            <a href="#/" className="btn btn-secondary">
              Back to Mailbox
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="write-form">
      <h2>Write a Letter</h2>
      <div>
        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A message for you..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Your Letter:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dear friend..."
            rows="12"
            required
          />
        </div>
        <div className="nav-buttons">
          <button type="button" className="btn btn-primary" onClick={handleSend}>
            Seal & Send
          </button>
          <a href="#/" className="btn btn-secondary">
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
};

// View letter by code page
const ViewPage = () => {
  const { getParam, navigate } = useRouter();
  const [codeInput, setCodeInput] = useState('');
  const [letter, setLetter] = useState(null);
  const [showLetter, setShowLetter] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const codeFromUrl = getParam('code');
    if (codeFromUrl) {
      setCodeInput(codeFromUrl);
      findLetter(codeFromUrl);
    }
  }, [getParam]);

  const findLetter = (code) => {
    if (!code.trim()) {
      setError('Please enter a letter code');
      return;
    }

    const letterData = localStorage.getItem(`letter_${code.trim().toUpperCase()}`);
    if (letterData) {
      setLetter(JSON.parse(letterData));
      setError('');
    } else {
      setError('Letter not found. Check the code and try again.');
      setLetter(null);
    }
  };

  const handleCodeSubmit = () => {
    findLetter(codeInput);
  };

  const openEnvelope = () => {
    if (!letter) return;
    setIsOpening(true);
    setTimeout(() => {
      setShowLetter(true);
    }, 900);
  };

  const closeLetter = () => {
    setShowLetter(false);
    setIsOpening(false);
  };

  if (showLetter && letter) {
    return (
      <div className="letter-view">
        <div className="letter-card">
          <div className="letter-meta">
            <div>From: <strong>Anonymous Friend</strong></div>
            <div>{new Date(letter.dateCreated).toLocaleDateString()}</div>
          </div>
          <h3>{letter.subject}</h3>
          <div className="letter-body">
            {letter.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < letter.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
          <div className="letter-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/write')}>
              Write Reply
            </button>
            <button className="btn btn-primary" onClick={closeLetter}>
              Close Letter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-page">
      <div className="code-entry">
        <h2>Enter Letter Code</h2>
        <div>
          <div className="form-group">
            <label htmlFor="code">6-Character Code:</label>
            <input
              type="text"
              id="code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength="6"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleCodeSubmit}>
            Find Letter
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="nav-buttons">
          <a href="#/" className="btn btn-secondary">Back to Mailbox</a>
        </div>
      </div>

      {letter && (
        <div className="found-letter">
          <h3>Letter Found!</h3>
          <Envelope onClick={openEnvelope} isOpening={isOpening} />
        </div>
      )}
    </div>
  );
};

// Main App component
const App = () => {
  const { currentPath } = useRouter();

  const renderPage = () => {
    const basePath = currentPath.split('?')[0];
    switch (basePath) {
      case '/write':
        return <WritePage />;
      case '/view':
        return <ViewPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1 className="club-title">Digital Mail Club</h1>
          <p className="privacy-label">Where letters find their way</p>
        </div>

        {renderPage()}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Caveat:wght@400;600&display=swap');

        :root {
          --cream: #F7F2EA;
          --dusty-blue: #7FA3B2;
          --warm-yellow: #F1C96B;
          --kraft: #D4B89B;
          --faded-rose: #C98088;
          --ink: #3B3A39;
          --moss: #6C7A5C;
          --paper-shadow: rgba(0,0,0,.08);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          font-family: "Special Elite", "Courier New", monospace;
          background: linear-gradient(135deg, var(--cream) 0%, #F0EBE3 100%);
          color: var(--ink);
          min-height: 100vh;
          background-image: 
            radial-gradient(circle at 20% 50%, transparent 20%, rgba(0,0,0,0.02) 21%, rgba(0,0,0,0.02) 34%, transparent 35%, transparent),
            linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.01) 25%, rgba(0,0,0,0.01) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.01) 75%, rgba(0,0,0,0.01) 76%, transparent 77%, transparent);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          position: relative;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .club-title {
          font-family: "Caveat", cursive;
          font-size: 2.5rem;
          color: var(--moss);
          margin-bottom: 5px;
          text-shadow: 2px 2px 4px var(--paper-shadow);
        }

        .privacy-label {
          font-size: 0.9rem;
          color: var(--dusty-blue);
          opacity: 0.8;
        }

        /* Mailbox View */
        .mailbox {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          margin-top: 40px;
        }

        .envelope {
          position: relative;
          width: 500px;
          height: 320px;
          background: var(--kraft);
          border-radius: 12px;
          box-shadow: 0 8px 25px var(--paper-shadow);
          cursor: pointer;
          transition: all 0.3s ease;
          transform-style: preserve-3d;
        }

        .envelope:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px var(--paper-shadow);
        }

        .envelope-front {
          position: absolute;
          width: 100%;
          height: 100%;
          background: var(--kraft);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .envelope-flap {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100px;
          background: linear-gradient(135deg, var(--kraft) 0%, #C9A98A 100%);
          clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
          transform-origin: top center;
          transition: transform 0.6s cubic-bezier(.2,.7,.2,1);
          z-index: 3;
          border-radius: 12px 12px 0 0;
        }

        .envelope.opening .envelope-flap {
          transform: rotateX(-120deg);
        }

        .wax-seal {
          position: absolute;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: var(--faded-rose);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
          transition: all 0.3s ease;
        }

        .wax-seal::after {
          content: "★";
          color: var(--cream);
          font-size: 18px;
        }

        .addressee {
          font-family: "Caveat", cursive;
          font-size: 2rem;
          color: var(--ink);
          text-align: center;
          margin-top: 150px;
          z-index: 1;
          position: relative;
        }

        .postage-area {
          position: absolute;
          top: 40px;
          right: 40px;
          width: 90px;
          height: 90px;
          border: 3px dashed var(--dusty-blue);
          border-radius: 8px;
          opacity: 0.4;
          z-index: 1;
        }

        .unread-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--faded-rose);
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
          z-index: 4;
        }

        .nav-buttons {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 20px;
          font-family: "Special Elite", monospace;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          box-shadow: 0 4px 12px var(--paper-shadow);
        }

        .btn-primary {
          background: var(--dusty-blue);
          color: white;
        }

        .btn-secondary {
          background: var(--warm-yellow);
          color: var(--ink);
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px var(--paper-shadow);
        }

        /* Letter View */
        .letter-view {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .letter-card {
          background: var(--cream);
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 12px 40px var(--paper-shadow);
          position: relative;
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 24px,
              rgba(111, 122, 92, 0.1) 25px,
              rgba(111, 122, 92, 0.1) 26px
            );
          max-height: 70vh;
          overflow-y: auto;
          animation: slideIn 0.8s cubic-bezier(.2,.7,.2,1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) rotate(-2deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotate(0);
          }
        }

        .letter-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 0.9rem;
          color: var(--moss);
          border-bottom: 1px solid rgba(111, 122, 92, 0.2);
          padding-bottom: 10px;
        }

        .letter-body {
          font-family: "Caveat", cursive;
          font-size: 1.3rem;
          line-height: 1.8;
          color: var(--ink);
        }

        .letter-actions {
          display: flex;
          gap: 10px;
          margin-top: 30px;
          justify-content: center;
        }

        /* Write View */
        .write-form {
          max-width: 600px;
          margin: 0 auto;
          background: var(--cream);
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 12px 40px var(--paper-shadow);
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 24px,
              rgba(111, 122, 92, 0.1) 25px,
              rgba(111, 122, 92, 0.1) 26px
            );
        }

        .write-form h2 {
          font-family: "Caveat", cursive;
          font-size: 2rem;
          color: var(--moss);
          margin-bottom: 20px;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.9rem;
          color: var(--moss);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--dusty-blue);
          border-radius: 6px;
          font-family: inherit;
          font-size: 1rem;
          background: rgba(255,255,255,0.8);
        }

        .form-group textarea {
          font-family: "Caveat", cursive;
          font-size: 1.2rem;
          resize: vertical;
          line-height: 1.8;
        }

        /* Success Message */
        .success-message {
          text-align: center;
          padding: 20px;
        }

        .code-display {
          margin-bottom: 30px;
          padding: 20px;
          background: rgba(255,255,255,0.5);
          border-radius: 12px;
          border: 2px dashed var(--dusty-blue);
        }

        .generated-code {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--faded-rose);
          margin: 15px 0;
          letter-spacing: 4px;
          font-family: "Special Elite", monospace;
        }

        .share-link {
          margin-bottom: 20px;
        }

        .link-input {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          border: 1px solid var(--dusty-blue);
          border-radius: 4px;
          background: var(--cream);
          text-align: center;
          font-size: 0.9rem;
        }

        /* View Page */
        .view-page {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .code-entry {
          background: var(--cream);
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 12px 40px var(--paper-shadow);
          margin-bottom: 30px;
          background-image: 
            repeating-linear-gradient(
              transparent,
              transparent 24px,
              rgba(111, 122, 92, 0.1) 25px,
              rgba(111, 122, 92, 0.1) 26px
            );
        }

        .code-entry h2 {
          font-family: "Caveat", cursive;
          font-size: 2rem;
          color: var(--moss);
          margin-bottom: 20px;
        }

        .error-message {
          color: var(--faded-rose);
          margin-top: 10px;
          font-weight: bold;
        }

        .found-letter {
          animation: slideIn 0.6s ease-out;
        }

        .found-letter h3 {
          font-family: "Caveat", cursive;
          font-size: 1.8rem;
          color: var(--moss);
          margin-bottom: 20px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          
          .envelope {
            width: 350px;
            height: 220px;
          }
          
          .club-title {
            font-size: 2rem;
          }
          
          .letter-card,
          .write-form,
          .code-entry {
            padding: 20px;
            margin: 10px;
          }
          
          .nav-buttons {
            gap: 10px;
          }
          
          .btn {
            padding: 8px 16px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default App;