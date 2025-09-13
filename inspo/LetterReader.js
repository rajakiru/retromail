import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X, Mail, Clock, User, Hash, Sparkles, Heart } from "lucide-react";

export default function LetterReader({ letter, onClose }) {
  const [animationPhase, setAnimationPhase] = useState('opening');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Start with envelope opening animation
    const timer1 = setTimeout(() => {
      setAnimationPhase('revealing');
    }, 1500);

    const timer2 = setTimeout(() => {
      setAnimationPhase('reading');
    }, 2500);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {animationPhase === 'opening' && (
          <div className="text-center">
            <div className="envelope-container mb-6 opening-envelope inline-block" style={{ fontSize: '120px' }}>
              <div className="envelope-back bg-white w-32 h-24"></div>
              <div className="envelope-flap bg-pink-200 w-36 h-16"></div>
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-fuchsia-500 sparkling" />
              <Heart className="absolute -bottom-2 -left-4 w-6 h-6 text-pink-500 sparkling" />
            </div>
            <p className="title-font text-2xl text-fuchsia-600 pastel-glow">
              Opening your letter...
            </p>
          </div>
        )}

        {animationPhase === 'revealing' && (
          <div className="text-center sliding-letter">
            <div className="mb-6">
              <Sparkles className="w-16 h-16 mx-auto text-fuchsia-500 sparkling mb-4" />
              <p className="title-font text-3xl text-fuchsia-600 pastel-glow">
                ✨ You've got mail! ✨
              </p>
            </div>
          </div>
        )}

        {animationPhase === 'reading' && (
          <div className="pastel-border pastel-shadow rounded-lg bg-[#fdf2f8] text-purple-800 sliding-letter">
            {/* Header */}
            <div className="retro-header p-6 border-b-2 border-purple-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="title-font text-4xl text-fuchsia-600 pastel-glow mb-2 flex items-center gap-3">
                    <div className="envelope-container wiggling-envelope">
                      <div className="envelope-back bg-white w-8 h-6"></div>
                      <div className="envelope-flap bg-pink-200 w-9 h-4"></div>
                      <Heart className="absolute -top-1 -right-1 w-3 h-3 text-pink-500 sparkling" />
                    </div>
                    You've got mail!
                  </h2>
                </div>
                <Button
                  onClick={onClose}
                  className="retro-button text-red-800 border-red-800 bg-red-200 p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="p-6 border-b-2 border-purple-200">
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-fuchsia-500" />
                  <span className="text-sm font-bold">FROM:</span>
                  <span className="font-medium text-purple-700">{letter.sender_name}</span>
                  <Sparkles className="w-3 h-3 text-pink-400 sparkling" />
                </div>
                 <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-fuchsia-500" />
                  <span className="text-sm font-bold">SENT:</span>
                  <span className="text-purple-700 text-sm">
                    {format(new Date(letter.created_date), "PPP 'at' p")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-fuchsia-500" />
                  <span className="text-sm font-bold">CODE:</span>
                  <span className="font-mono text-white bg-pink-500 px-2 py-1 rounded bouncing-envelope">
                    {letter.secret_code}
                  </span>
                </div>
                {letter.read_at && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-500" />
                    <span className="text-sm font-bold">READ:</span>
                    <span className="text-purple-700 text-sm">
                      {format(new Date(letter.read_at), "PPP 'at' p")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="p-6 border-b-2 border-purple-200">
              <h3 className="text-2xl text-pink-600 font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500 sparkling" />
                {letter.subject}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-white p-6 rounded-lg pastel-border relative">
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 sparkling" />
                </div>
                <div className="text-purple-800 leading-relaxed whitespace-pre-wrap text-base">
                  {letter.content}
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Heart className="w-4 h-4 text-pink-400 sparkling" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles 
                      key={i} 
                      className="w-3 h-3 text-pink-400 sparkling" 
                      style={{ animationDelay: `${i * 0.3}s` }}
                    />
                  ))}
                </div>
                <Button
                  onClick={onClose}
                  className="retro-button bg-purple-200 border-purple-800 text-purple-800 px-8 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
