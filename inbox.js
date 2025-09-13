
import React, { useState, useEffect } from "react";
import { Letter } from "@/entities/Letter";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Mail, MailOpen, Key, Sparkles, Heart } from "lucide-react";

import LetterReader from "../components/letters/LetterReader";

export default function Inbox() {
  const [letters, setLetters] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndLetters();
  }, []);

  const loadUserAndLetters = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const userLetters = await Letter.filter(
        { recipient_email: currentUser.email },
        '-created_date'
      );
      setLetters(userLetters);
    } catch (error) {
      console.error("Error loading letters:", error);
    }
    setLoading(false);
  };

  const handleOpenLetter = async (letter) => {
    if (!letter.is_read) {
      await Letter.update(letter.id, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      loadUserAndLetters();
    }
    setSelectedLetter(letter);
  };

  const handleOpenBySecretCode = async () => {
    if (!secretCode.trim()) return;
    
    try {
      const foundLetters = await Letter.filter({ secret_code: secretCode.trim() });
      if (foundLetters.length > 0) {
        const letter = foundLetters[0];
        if (!letter.is_read) {
          await Letter.update(letter.id, {
            is_read: true,
            read_at: new Date().toISOString()
          });
          loadUserAndLetters();
        }
        setSelectedLetter(letter);
        setSecretCode("");
      } else {
        alert("❌ INVALID SECRET CODE");
      }
    } catch (error) {
      console.error("Error finding letter:", error);
      alert("❌ SYSTEM ERROR");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="envelope-container mb-4 bouncing-envelope inline-block">
          <div className="envelope-back bg-white w-16 h-12"></div>
          <div className="envelope-flap bg-pink-200 w-18 h-8"></div>
          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-fuchsia-500 sparkling" />
        </div>
        <div className="title-font text-4xl text-fuchsia-600 mb-4 pastel-glow">
          Loading Mailbox<span className="cursor-blink"></span>
        </div>
        <div className="text-sm text-purple-600">Checking for mail...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b-2 border-purple-300 pb-4">
          <h2 className="title-font text-4xl text-fuchsia-600 pastel-glow mb-2 flex items-center gap-3">
            <div className="envelope-container wiggling-envelope">
              <div className="envelope-back bg-white w-8 h-6"></div>
              <div className="envelope-flap bg-pink-200 w-9 h-4"></div>
            </div>
            Your Inbox
          </h2>
          <p className="text-sm text-purple-700">
            Logged in as: {user?.full_name || user?.email}
          </p>
        </div>

        {/* Secret Code Access */}
        <div className="bg-pink-100 p-4 rounded-lg pastel-border">
          <h3 className="text-lg text-pink-700 mb-3 flex items-center gap-2 font-bold">
            <Key className="w-5 h-5" />
            Open With a Secret Code
          </h3>
          <div className="flex gap-2">
            <Input
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              placeholder="6-DIGIT CODE"
              className="retro-input text-pink-600 placeholder:text-pink-400"
              maxLength={6}
              onKeyPress={(e) => e.key === 'Enter' && handleOpenBySecretCode()}
            />
            <Button
              onClick={handleOpenBySecretCode}
              className="retro-button text-purple-800 border-purple-800 bg-purple-200 px-6"
            >
              OPEN
            </Button>
          </div>
        </div>

        {/* Letters List */}
        <div>
          <h3 className="text-2xl text-purple-800 mb-4 flex items-center gap-2 font-bold title-font">
            <Mail className="w-6 h-6" />
            Messages ({letters.length})
          </h3>
          
          {letters.length === 0 ? (
            <div className="text-center py-12 pastel-border rounded-lg bg-purple-50">
              <div className="envelope-container mb-4 bouncing-envelope">
                <div className="envelope-back bg-white w-16 h-12"></div>
                <div className="envelope-flap bg-purple-200 w-18 h-8"></div>
              </div>
              <p className="text-purple-600 text-lg font-bold">No new messages!</p>
              <p className="text-purple-500 text-sm mt-2">Your mailbox is waiting for letters...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {letters.map((letter, index) => (
                <div
                  key={letter.id}
                  onClick={() => handleOpenLetter(letter)}
                  className={`retro-button p-4 rounded-lg cursor-pointer transition-all duration-300 w-full text-left relative ${
                    letter.is_read 
                      ? 'bg-purple-100 border-purple-400 shadow-none' 
                      : 'bg-white pastel-shadow border-purple-800 bouncing-envelope'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="envelope-container mt-1 flex-shrink-0">
                        <div className={`envelope-back w-6 h-4 ${letter.is_read ? 'bg-purple-200' : 'bg-white'}`}></div>
                        <div className={`envelope-flap w-7 h-3 ${letter.is_read ? 'bg-purple-300' : 'bg-pink-200'}`}></div>
                        {!letter.is_read && (
                          <>
                            <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-fuchsia-500 sparkling" />
                            <Heart className="absolute -bottom-1 -left-1 w-2 h-2 text-pink-500 sparkling" />
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-bold ${letter.is_read ? 'text-purple-500' : 'text-purple-800'}`}>
                            {letter.sender_name}
                          </span>
                          {!letter.is_read && (
                            <Badge className="bg-pink-500 text-white text-xs border-2 border-white sparkling">
                              NEW!
                            </Badge>
                          )}
                        </div>
                        <div className={`text-lg font-bold mb-1 ${letter.is_read ? 'text-purple-400' : 'text-pink-600'}`}>
                          {letter.subject}
                        </div>
                        <div className={`text-sm line-clamp-2 ${letter.is_read ? 'text-purple-400' : 'text-purple-600'}`}>
                          {letter.content.substring(0, 80)}
                          {letter.content.length > 80 && "..."}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm flex-shrink-0">
                      <div className="text-purple-500 mb-1 text-xs">
                        {format(new Date(letter.created_date), "MMM d")}
                      </div>
                      <div className="text-xs text-fuchsia-600 font-bold bg-fuchsia-100 px-2 py-1 rounded">
                        {letter.secret_code}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cute decoration */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="envelope-container bouncing-envelope" style={{ animationDelay: `${i * 0.5}s` }}>
                <div className="envelope-back bg-pink-100 w-4 h-3"></div>
                <div className="envelope-flap bg-pink-200 w-5 h-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Letter Reader Modal */}
      {selectedLetter && (
        <LetterReader
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </>
  );
}
