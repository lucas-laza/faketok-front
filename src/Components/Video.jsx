// Video.jsx
import React, { useEffect, useRef, useState } from 'react';

const Video = React.forwardRef(({ url, isActive, onLike, isLiked, onNotInterested, isNotInterested }, ref) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Gestion du statut de la vidéo (play/pause/reset)
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0; // Réinitialise la vidéo à 0
        videoRef.current.play()
          .then(() => {
            setIsPaused(false); // Masquer l'icône de pause
          })
          .catch((error) => {
            console.error('Erreur lors de la lecture automatique :', error);
          });
      } else {
        videoRef.current.pause();
        setIsPaused(true); // Afficher l'icône de pause si elle n'est pas active
      }
    }
  }, [isActive]);

  // Gestion des clics pour play/pause
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false); // Masquer l'icône de pause
      } else {
        videoRef.current.pause();
        setIsPaused(true); // Afficher l'icône de pause
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={(el) => {
          videoRef.current = el;
          if (ref) ref(el);
        }}
        key={url} // Force le rechargement correct en cas de changement d'URL
        src={url}
        style={{ width: '100%', height: '100%' }}
        loop
        controls={false}
        playsInline
        onClick={handleVideoClick}
      />
      {isActive && isPaused && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '3rem',
            pointerEvents: 'none',
          }}
        >
          ⏸
        </div>
      )}
      {/* Bouton cœur */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '5px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            width: '60px',
            height: '60px',
          }}
          onClick={(e) => {
            e.stopPropagation(); // Empêche la propagation vers la vidéo
            onLike(); // Appelle explicitement la fonction de gestion du like
          }}
        >
          <svg
            fill={isLiked ? "red" : "#b0b0b0"}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            stroke={isLiked ? "red" : "black"}
            style={{ width: '100%', height: '100%' }}
          >
            <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
          </svg>
          <span>Like</span>
          
        </div>
      )}

      {/* Bouton "Not Interested" */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '60%',
            right: '5px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            width: '60px',
            height: '60px',
            marginTop: "20px",
            textAlign: "center"
          }}
          onClick={(e) => {
            e.stopPropagation(); // Empêche la propagation vers la vidéo
            onNotInterested(); // Appelle la fonction de gestion "Not Interested"
          }}
        >
          <br />
          <svg
            fill={isNotInterested ? "black" : "#b0b0b0"}
            viewBox="-1.6 -1.6 19.20 19.20"
            xmlns="http://www.w3.org/2000/svg"
            stroke={isNotInterested ? "purple" : "gray"}
            strokeWidth="1.6"
            style={{ width: '100%', height: '100%' }}
          >
            <path d="M-14,0a8.009,8.009,0,0,0-8,8,8.009,8.009,0,0,0,8,8A8.009,8.009,0,0,0-6,8,8.009,8.009,0,0,0-14,0Zm7,8a6.963,6.963,0,0,1-1.716,4.577l-9.861-9.861A6.963,6.963,0,0,1-14,1,7.008,7.008,0,0,1-7,8ZM-21,8a6.963,6.963,0,0,1,1.716-4.577l9.861,9.861A6.963,6.963,0,0,1-14,15,7.008,7.008,0,0,1-21,8Z" transform="translate(22)"></path>
          </svg>
          <span style={{marginRight: "20px", position: "relative", right: "0"}}>Je n'aime pas</span>
        </div>
      )}



    </div>
  );
});

export default Video;
