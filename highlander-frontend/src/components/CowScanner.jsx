// src/components/CowScanner.jsx
import React, { useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

export function CowScanner({ onResult, scannerActive }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null); // Ukryty canvas do przechwytywania klatek

  useEffect(() => {
    if (!scannerActive) {
      return; // Jeśli nieaktywny, nie rób nic
    }

    let animationFrameId;

    // Funkcja, która będzie uruchamiana dla każdej klatki wideo
    const scanFrame = () => {
      // Zatrzymaj, jeśli już nie jesteśmy aktywni
      if (!scannerActive || !webcamRef.current) {
        cancelAnimationFrame(animationFrameId);
        return;
      }

      const video = webcamRef.current.video;
      
      // Sprawdź, czy wideo jest gotowe
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Dopasuj rozmiar canvasu do wideo
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Narysuj klatkę wideo na ukrytym canvasie
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Pobierz dane obrazu z canvasu
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Spróbuj znaleźć kod QR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          // ZNALEZIONO KOD!
          onResult(code.data); // Przekaż wynik i zakończ
          return; // Zakończ pętlę skanowania
        }
      }

      // Jeśli nie znaleziono, spróbuj ponownie w następnej klatce
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    // Rozpocznij pętlę skanowania
    animationFrameId = requestAnimationFrame(scanFrame);

    // Funkcja czyszcząca
    return () => {
      cancelAnimationFrame(animationFrameId); // Zatrzymaj pętlę
    };
  }, [scannerActive, onResult]); // Uruchom ponownie, gdy zmieni się status lub funkcja

  if (!scannerActive) {
    // Jeśli nie skanujemy (np. po znalezieniu),
    // nie renderuj nic, aby zwolnić kamerę.
    return null; 
  }

  return (
    <>
      <Webcam
        ref={webcamRef}
        audio={false}
        // Wymusza użycie tylnej kamery na mobilkach
        videoConstraints={{ facingMode: "environment" }}
        // Te style zapewnią dopasowanie do kontenera nadrzędnego
        className="w-full h-full object-cover" 
      />
      {/* Ten canvas jest ukryty i służy tylko do przetwarzania obrazu */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
