import { useEffect, useState } from 'react';
import { getRestaurant } from '@/api/services';

export default function WhatsAppFloatButton() {
  const [waNumber, setWaNumber] = useState<string | null>(null);

  useEffect(() => {
    getRestaurant()
      .then((r) => setWaNumber(r.whatsappNumber ?? null))
      .catch(() => setWaNumber(null));
  }, []);

  if (!waNumber) return null;

  const digits = waNumber.replace(/[^\d]/g, '');
  const link = `https://wa.me/${digits}?text=${encodeURIComponent('Hi! I would like to know more about your menu.')}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.653 4.527 1.786 6.393L4 29l7.813-1.746A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75c-1.93 0-3.734-.55-5.26-1.5l-.377-.223-4.636 1.036 1.06-4.51-.246-.394A9.7 9.7 0 0 1 5.25 15c0-5.93 4.824-10.75 10.754-10.75S26.75 9.07 26.75 15 21.934 24.75 16.004 24.75Zm5.94-8.03c-.325-.163-1.923-.95-2.222-1.058-.298-.108-.516-.163-.733.163-.217.325-.842 1.058-1.032 1.276-.19.217-.38.244-.706.081-.325-.163-1.372-.505-2.613-1.612-.966-.86-1.618-1.923-1.808-2.248-.19-.325-.02-.5.143-.663.146-.146.325-.38.488-.57.163-.19.217-.325.325-.542.108-.217.054-.407-.027-.57-.081-.163-.733-1.765-1.005-2.418-.264-.633-.532-.547-.733-.557l-.624-.011c-.217 0-.57.081-.868.407-.298.325-1.14 1.113-1.14 2.715 0 1.602 1.167 3.15 1.33 3.367.163.217 2.297 3.508 5.565 4.92.778.336 1.385.537 1.858.687.78.248 1.49.213 2.052.13.626-.094 1.923-.786 2.194-1.545.271-.76.271-1.41.19-1.546-.081-.135-.298-.217-.624-.38Z" />
      </svg>
    </a>
  );
}
