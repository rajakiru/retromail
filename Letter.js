{
  "name": "Letter",
  "type": "object",
  "properties": {
    "recipient_email": {
      "type": "string",
      "description": "Email address of the letter recipient"
    },
    "sender_name": {
      "type": "string",
      "description": "Display name of the sender"
    },
    "subject": {
      "type": "string",
      "description": "Subject line of the letter"
    },
    "content": {
      "type": "string",
      "description": "The letter content/body"
    },
    "secret_code": {
      "type": "string",
      "description": "Unique 6-digit code to access the letter"
    },
    "is_read": {
      "type": "boolean",
      "default": false,
      "description": "Whether the letter has been opened by recipient"
    },
    "read_at": {
      "type": "string",
      "format": "date-time",
      "description": "When the letter was first opened"
    }
  },
  "required": [
    "recipient_email",
    "sender_name",
    "subject",
    "content",
    "secret_code"
  ]
}
