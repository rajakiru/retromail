
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, PenTool, Inbox, Zap, Sparkles } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navigationItems = [
    { title: "Inbox", url: createPageUrl("Inbox"), icon: Inbox },
    { title: "Compose", url: createPageUrl("Compose"), icon: PenTool },
  ];

  return (
    <div className="min-h-screen bg-[#fce7f3] text-[#581c87] font-mono overflow-x-hidden relative">
      {/* Retro Noise/Grain Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 800 800\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
      }}></div>

      {/* Retro Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;700&display=swap');
        
        * {
          font-family: 'JetBrains Mono', monospace !important;
        }
        
        .title-font {
           font-family: 'VT323', monospace !important;
        }

        @keyframes soft-flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px currentColor; }
          50% { opacity: 0.95; text-shadow: 0 0 6px currentColor; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes envelope-fly {
          0% { 
            transform: translateX(0) translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translateX(200px) translateY(-100px) rotate(15deg) scale(0.8);
            opacity: 0.8;
          }
          100% { 
            transform: translateX(400px) translateY(-200px) rotate(30deg) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes envelope-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }

        @keyframes envelope-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }

        @keyframes envelope-open {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(-90deg); }
          100% { transform: rotateX(-180deg); }
        }

        @keyframes letter-slide-up {
          0% { 
            transform: translateY(100px); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }

        @keyframes sparkle-dance {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          33% { transform: scale(1.2) rotate(120deg); opacity: 1; }
          66% { transform: scale(0.8) rotate(240deg); opacity: 0.8; }
        }

        .flying-envelope {
          animation: envelope-fly 2s ease-in-out forwards;
        }

        .bouncing-envelope {
          animation: envelope-bounce 2s infinite;
        }

        .wiggling-envelope {
          animation: envelope-wiggle 1s infinite;
        }

        .opening-envelope {
          animation: envelope-open 1.5s ease-in-out forwards;
          transform-origin: top;
        }

        .sliding-letter {
          animation: letter-slide-up 1s ease-out forwards;
        }

        .sparkling {
          animation: sparkle-dance 2s infinite;
        }
        
        .pastel-glow {
          animation: soft-flicker 3s infinite;
        }
        
        .pastel-shadow {
          box-shadow: 4px 4px 0px 0px #be185d;
        }
        
        .pastel-border {
          border: 2px solid #581c87;
        }
        
        .cursor-blink::after {
          content: "█";
          animation: blink 1.2s infinite;
          margin-left: 4px;
          color: #db2777;
        }
        
        .retro-button {
          position: relative;
          background: #fdf2f8;
          border: 2px solid #581c87;
          transition: all 0.2s ease;
          box-shadow: 3px 3px 0px 0px #581c87;
        }
        
        .retro-button:hover {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px #581c87;
        }

        .retro-button.active {
           background: #e879f9;
           color: white;
           box-shadow: 3px 3px 0px 0px #be185d;
        }
        
        .retro-input {
          background: #fdf2f8;
          border: 2px solid #581c87;
          color: #86198f;
          font-family: inherit;
        }
        
        .retro-input:focus {
          outline: none;
          box-shadow: 0 0 10px #f472b6;
          border-color: #f472b6;
        }
        
        .retro-header {
          background: #fbcfe8;
          border: 2px solid #581c87;
          position: relative;
        }

        /* Envelope Styles */
        .envelope-container {
          position: relative;
          display: inline-block;
        }

        .envelope-back {
          width: 40px;
          height: 30px;
          background: #f8fafc;
          border: 2px solid #581c87;
          border-radius: 4px;
        }

        .envelope-flap {
          width: 44px;
          height: 20px;
          background: #fdf2f8;
          border: 2px solid #581c87;
          border-bottom: none;
          clip-path: polygon(0 0, 50% 100%, 100% 0);
          position: absolute;
          top: -2px;
          left: -2px;
          transform-origin: bottom;
        }
      `}</style>

      {/* Header */}
      <div className="retro-header p-4 mb-8 pastel-shadow mx-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="title-font text-5xl md:text-6xl font-bold text-pink-600 mb-1 pastel-glow flex items-center">
                <Sparkles className="w-8 h-8 mr-4 text-fuchsia-500"/>
                Digital Letters
                <span className="cursor-blink"></span>
              </h1>
              <p className="text-sm text-purple-600 opacity-80">
                &gt; A Super Cute Messaging System
              </p>
            </div>
            <div className="flex items-center gap-2 bg-purple-200 text-purple-800 px-3 py-1 rounded border-2 border-purple-800">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <nav className="flex flex-wrap gap-4">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`retro-button px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                location.pathname === item.url
                  ? 'active'
                  : 'hover:bg-fuchsia-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.title.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        <div className="pastel-border pastel-shadow rounded-lg bg-[#fdf2f8] p-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <div className="mt-12 p-4 text-center text-xs text-purple-500 opacity-70">
        <p>© 1988 Digital Letters Inc. // Have a groovy day!</p>
      </div>
    </div>
  );
}
