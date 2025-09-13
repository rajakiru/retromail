
import React, { useState } from "react";
import { Letter } from "@/entities/Letter";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PenTool, Send, Trash2, CheckCircle, Sparkles } from "lucide-react";

export default function Compose() {
  const [formData, setFormData] = useState({
    recipient_email: "",
    subject: "",
    content: ""
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [showFlyingEnvelope, setShowFlyingEnvelope] = useState(false);

  const generateSecretCode = () => {
    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 36).toString(36).toUpperCase()
    ).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipient_email || !formData.subject || !formData.content) {
      setError("❌ ALL FIELDS REQUIRED");
      return;
    }

    setSending(true);
    setError("");

    // Show flying envelope animation
    setShowFlyingEnvelope(true);

    try {
      const user = await User.me();
      const secretCode = generateSecretCode();

      await Letter.create({
        recipient_email: formData.recipient_email.toLowerCase(),
        sender_name: user.full_name || user.email,
        subject: formData.subject,
        content: formData.content,
        secret_code: secretCode,
        is_read: false
      });

      // Wait for animation to complete
      setTimeout(() => {
        setSuccess({
          message: "✨ MESSAGE SENT SUCCESSFULLY!",
          secretCode: secretCode
        });
        setShowFlyingEnvelope(false);
      }, 2000); // Animation duration of 2 seconds

      setFormData({
        recipient_email: "",
        subject: "",
        content: ""
      });
    } catch (error) {
      console.error("Error sending letter:", error);
      setError("❌ TRANSMISSION FAILED - RETRY");
      setShowFlyingEnvelope(false); // Hide envelope on error
    }

    setSending(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  return (
    <div className="space-y-8 relative">
      {/* Flying Envelope Animation */}
      {showFlyingEnvelope && (
        <div className="fixed top-1/2 left-1/4 z-50 flying-envelope">
          <div className="envelope-container text-6xl">
            <div className="envelope-back bg-white"></div>
            <div className="envelope-flap bg-pink-200"></div>
            <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-fuchsia-500 sparkling" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-purple-300 pb-4">
        <h2 className="title-font text-4xl text-fuchsia-600 pastel-glow mb-2 flex items-center gap-3">
          <div className="envelope-container">
            <div className="envelope-back bg-white w-8 h-6"></div>
            <div className="envelope-flap bg-pink-200 w-9 h-4"></div>
          </div>
          Compose Message
        </h2>
        <p className="text-sm text-purple-700">
          Sending good vibes across the network...
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="pastel-border bg-green-100 text-green-800 sliding-letter">
          <div className="sparkling">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-bold text-lg">{success.message}</div>
              <div className="text-sm">
                <span>Secret Code: </span>
                <span className="font-mono text-lg text-white bg-pink-500 px-3 py-1 rounded bounce">
                  {success.secretCode}
                </span>
              </div>
              <div className="text-xs text-green-600">
                ✨ Share this magical code with your recipient!
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="pastel-border bg-red-100 text-red-800">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Compose Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-purple-800 mb-2 font-bold">
              To (Email)
            </label>
            <Input
              type="email"
              value={formData.recipient_email}
              onChange={(e) => handleInputChange('recipient_email', e.target.value)}
              placeholder="friend@example.com"
              className="retro-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-purple-800 mb-2 font-bold">
              Subject
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="A groovy message"
              className="retro-input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-purple-800 mb-2 font-bold">
            Your Letter
          </label>
          <Textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Write something sweet..."
            className="retro-input min-h-48"
            required
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            className="retro-button bg-rose-200 border-rose-800 text-rose-800 px-8 py-3"
            onClick={() => {
              setFormData({ recipient_email: "", subject: "", content: "" });
              setSuccess(null);
              setShowFlyingEnvelope(false); // Hide envelope if cleared during animation
            }}
          >
            <Trash2 className="w-4 h-4 mr-2"/>
            CLEAR
          </Button>
          <Button
            type="submit"
            disabled={sending}
            className="retro-button bg-fuchsia-300 border-fuchsia-800 text-fuchsia-800 px-8 py-3 relative overflow-hidden"
          >
            {sending ? (
              <>
                <div className="envelope-container mr-2">
                  <div className="envelope-back bg-white w-4 h-3 bouncing-envelope"></div>
                  <div className="envelope-flap bg-pink-200 w-5 h-2"></div>
                </div>
                SENDING...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                SEND LETTER
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Cute decoration */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Sparkles
              key={i}
              className="w-4 h-4 text-pink-400 sparkling"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
