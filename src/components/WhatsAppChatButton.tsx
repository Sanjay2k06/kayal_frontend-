const whatsappNumber = import.meta.env.VITE_WHATSAPP_BOT_NUMBER || "+14155238886";
const initialText = encodeURIComponent(
  import.meta.env.VITE_WHATSAPP_BOT_MESSAGE || "Hi CiviX bot, I want to check my eligibility."
);

const sanitizedNumber = whatsappNumber.replace(/[^\d]/g, "");
const href = `https://wa.me/${sanitizedNumber}?text=${initialText}`;

const WhatsAppChatButton = () => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with CiviX WhatsApp bot"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-card hover:bg-muted"
    >
      <span aria-hidden="true">💬</span>
      Chat on WhatsApp
    </a>
  );
};

export default WhatsAppChatButton;
