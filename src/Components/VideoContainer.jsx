// VideoContainer.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Video from './Video';
import { useSwipeable } from 'react-swipeable';

const VideoContainer = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false); // État pour afficher l'écran de bienvenue
  const videoRefs = useRef([]); // Pour stocker les références des vidéos
  const [experienceEnded, setExperienceEnded] = useState(false); // Pour suivre si l'expérience est terminée
  const [animal, setAnimal] = useState(''); // Pour stocker le type d'animal (chat ou chien)
  const [isExperienceOver, setIsExperienceOver] = useState(false); // Indique si l'expérience est terminée



  // Fonction pour récupérer les vidéos recommandées

  const fetchMoreVideos = async () => {
    if (isExperienceOver) return; // Ne rien faire si l'expérience est terminée
  
    setIsFetching(true);
  
    try {
      const response = await axios.get('http://localhost:3001/visionnage/recommend', {
        withCredentials: true,
      });
  
      if (response.data.length === 1 && response.data[0].ended) {
        // Si l'expérience est terminée
        setExperienceEnded(true);
        setAnimal(response.data[0].animal); // Définit l'animal (chat ou chien)
        setIsExperienceOver(true); // Empêche les appels ultérieurs
      } else {
        // Sinon, ajoutez les vidéos
        const newVideos = response.data.map((video) => ({
          ...video,
          hasLiked: false,
          hasNotInterested: false,
          videoUrl: `http://localhost:3001/videos/${video.url}`,
        }));
        setVideos((prevVideos) => [...prevVideos, ...newVideos]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos recommandées :', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleNotInterested = (index) => {
    setVideos((prevVideos) => {
      const updatedVideos = prevVideos.map((video, i) =>
        i === index ? { ...video, hasNotInterested: !video.hasNotInterested } : video
      );
      return updatedVideos;
    });
  };
  
  

  useEffect(() => {
    // Charger les vidéos initiales seulement si l'expérience n'est pas terminée
    if (!isExperienceOver && videos.length === 0 && !experienceEnded) {
      fetchMoreVideos();
    }
  }, [videos, isExperienceOver, experienceEnded]); // Ajoutez `experienceEnded` ici
  

  // Lecture automatique de la première vidéo
  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[currentIndex]) {
      const currentVideoElement = videoRefs.current[currentIndex];

      currentVideoElement.play().catch((error) => {
        console.error("Erreur lors de la lecture automatique de la vidéo :", error);
        if (error.name === "NotAllowedError") {
          setShowWelcomeScreen(true); // Affiche l'écran de bienvenue si la lecture échoue
        }
      });
    }
  }, [videos, currentIndex]);

  // Suivre l'avancement de la vidéo active
  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[currentIndex]) {
      const currentVideoElement = videoRefs.current[currentIndex];
      let previousCompletion = 0;
      let previousTime = 0;
      let previousDuration = 0;

      const updateProgress = () => {
        const duration = currentVideoElement.duration || 0;
        const currentTime = currentVideoElement.currentTime || 0;
        const completion = duration > 0 ? currentTime / duration : 0;

        console.log(`Durée totale: ${duration.toFixed(2)}s`);
        console.log(`Avancement: ${currentTime.toFixed(2)}s`);
        console.log(`Complétion: ${(completion * 100).toFixed(2)}%`);

        if (completion < previousCompletion && completion < 0.01) {
          console.log("Retour au début détecté, envoi des données.");
          sendWatchData(videos[currentIndex], previousDuration, previousTime, previousCompletion, () => {
            console.log("Données envoyées après retour au début :", {
              duration: previousDuration,
              currentTime: previousTime,
              completion: previousCompletion,
            });
          });
          currentVideoElement.dataset.reported = "false";
        }

        if (completion >= 0.995 && currentVideoElement.dataset.reported === "false") {
          currentVideoElement.dataset.reported = "true";
          sendWatchData(videos[currentIndex], duration, currentTime, completion, () => {
            console.log("Envoyé ! Vidéo terminée.");
          });
        }

        previousCompletion = completion;
        previousTime = currentTime;
        previousDuration = duration;
      };

      currentVideoElement.addEventListener('timeupdate', updateProgress);

      return () => {
        currentVideoElement.removeEventListener('timeupdate', updateProgress);
      };
    }
  }, [currentIndex, videos]);

  // Lecture automatique de la vidéo active et mise en pause des autres vidéos
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          console.log(`Lecture de la vidéo index: ${index}`);
          video.play().catch((error) => {
            console.error("Erreur lors de la lecture automatique de la vidéo :", error);
          });
        } else {
          console.log(`Pause de la vidéo index: ${index}`);
          video.pause(); // Met en pause toutes les vidéos non actives
        }
      }
    });
  }, [currentIndex]);

  // Ajout pour gérer spécifiquement le cas de revenir à une vidéo précédente
  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[currentIndex]) {
      const currentVideoElement = videoRefs.current[currentIndex];
      console.log(`Vérification de l'état de la vidéo index: ${currentIndex}`);
      if (currentVideoElement.paused) {
        currentVideoElement.play().catch((error) => {
          console.error(
            `Erreur lors de la reprise de la vidéo index: ${currentIndex}`,
            error
          );
        });
      }
    }
  }, [currentIndex]);


  // Décharger les vidéos non nécessaires pour optimiser la mémoire
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex || index === currentIndex + 1) {
          // Charger la vidéo actuelle et la prochaine
          if (!video.src) {
            video.src = videos[index].videoUrl; // Charger la vidéo
            console.log(`Chargement du src pour la vidéo index: ${index}`);
          }
        } else {
          // Décharger toutes les autres vidéos (y compris la précédente)
          if (video.src) {
            video.removeAttribute('src'); // Décharger la vidéo
            video.load(); // Réinitialiser
            console.log(`Déchargement du src pour la vidéo index: ${index}`);
          }
        }
      }
    });
  }, [currentIndex, videos]);


  // Gestion des swipes
  const handleSwipe = (direction) => {
    if (showWelcomeScreen) {
      // Si l'encart est visible, cacher l'encart et ne pas changer l'index
      setShowWelcomeScreen(false);
      return;
    }

    const nextIndex = direction === 'up' ? currentIndex + 1 : direction === 'down' ? currentIndex - 1 : currentIndex;

    if (nextIndex >= 0 && nextIndex < videos.length) {
      handleSaveWatchData(currentIndex); // Enregistrer les données pour la vidéo actuelle
      setCurrentIndex(nextIndex); // Mettre à jour l'index après l'enregistrement

      // Charger plus de vidéos si on approche de la fin
      if (direction === 'up' && nextIndex === videos.length - 2 && !isFetching) {
        fetchMoreVideos();
      }
    }
  };

  // Enregistrer les données avant de changer de vidéo
  const handleSaveWatchData = (index) => {
    if (videos[index] && videoRefs.current[index]) {
      const currentVideoElement = videoRefs.current[index];
      const duration = currentVideoElement.duration || 0;
      const currentTime = currentVideoElement.currentTime || 0;
      const completion = duration > 0 ? currentTime / duration : 0;

      sendWatchData(videos[index], duration, currentTime, completion, () => {
        console.log("Données envoyées avant le changement de vidéo :", {
          duration,
          currentTime,
          completion,
        });
      });
    }
  };

  // Gestion du like
  const handleLike = (index) => {
    setVideos((prevVideos) => {
      // Copie profonde de l'objet vidéo pour forcer le rendu
      const updatedVideos = prevVideos.map((video, i) =>
        i === index ? { ...video, hasLiked: !video.hasLiked } : video
      );
      return updatedVideos;
    });
  };


  // Fonction pour envoyer les données de visionnage
  const sendWatchData = (video, duration, currentTime, completion, callback) => {
    if (!video) {
      console.error("Aucune vidéo trouvée pour envoyer les données.");
      return;
    }

    const watchData = {
      video_id: video.id,
      watched_prct: completion.toFixed(2),
      watched_in_seconds: currentTime.toFixed(2),
      has_liked: video.hasLiked,
      not_interested: video.hasNotInterested,
    };

    console.log("Données envoyées à /visionnage/watch :", watchData);

    axios.post('http://localhost:3001/visionnage/watch', watchData, {
      withCredentials: true,
    }).then(() => {
      console.log("Envoi réussi :", watchData);
      if (callback) callback();
    }).catch((error) => {
      console.error("Erreur lors de l'envoi à /visionnage/watch :", error);
    });
  };

  // Référence pour le conteneur principal et le bouton
const containerRef = useRef(null);

// Fonction pour gérer le clic sur le bouton "Go !"
const handleGoClick = () => {
  if (videoRefs.current[0]) {
    videoRefs.current[0].scrollIntoView({ behavior: 'smooth' }); // Scrolle vers la première vidéo
    setShowWelcomeScreen(false); // Cache l'écran de bienvenue
    setCurrentIndex(0); // Active la première vidéo
  } else {
    console.error("La première vidéo n'est pas disponible."); // Ajout d'un log pour débogage
  }
};


  // Gestion des flèches du clavier
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp') {
        handleSwipe('down');
      } else if (event.key === 'ArrowDown') {
        handleSwipe('up');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, videos]);

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => handleSwipe('up'),
    onSwipedDown: () => handleSwipe('down'),
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
    trackMouse: true,
  });

  if (videos.length === 0) return <p>Chargement des vidéos...</p>;

  return (
    <div
      {...swipeHandlers}
      ref={containerRef} // Attache la référence ici
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
    >
      {showWelcomeScreen && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 10,
          }}
        >
          <p style={{ textAlign: 'center', fontSize: '1rem', margin: '0 20px' }}>
            <h2>Bienvenue sur FakeTok!</h2> <br />
            <h3>On commence à regarder les vidéos 🎥 ?</h3>
            <p>
              Conseils :
              <ul>
                <li>La première vidéo sera probablement sur pause : au clic elle se lancera</li>
                <li>Pour passer à la deuxième vidéo, faites un mouvement de "swipe"</li>
                <li>À partir de la deuxième vidéo vous pourrez utiliser les fléches haut ↑ et bas ↓</li>
                <li>Pour "liker" une vidéo appuyez sur le coeur</li>
              </ul>
            </p>
            <br />
            <button
              onClick={handleGoClick}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: '#ff4742',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
            >
              Go !
            </button>
          </p>
        </div>
      )}
  
      {experienceEnded && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            zIndex: 20,
          }}
        >
          <h1>Expérience terminée</h1>
          <p style={{ fontSize: '1.5rem' }}>
            Vous êtes entré.e dans une bulle de pensée représentée par les vidéos de <strong>{animal}</strong>!
          </p>
          <button
            onClick={() => window.location.reload()} // Recharge la page pour recommencer
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: '#ff4742',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.target.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Recommencer
          </button>
        </div>
      )}
  
      {videos.map((video, index) => {
        const position = index - currentIndex;
        const translateY = position * 100;
  
        return (
          <div
            key={`${video.id}-${index}`}
            style={{
              transform: `translateY(${translateY}%)`,
              transition: 'transform 0.3s ease',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: position === 0 ? 1 : 0.8,
              zIndex: position === 0 ? 1 : 0,
            }}
          >
            <Video
              url={video.videoUrl}
              isActive={index === currentIndex}
              onLike={() => handleLike(index)}
              onNotInterested={() => handleNotInterested(index)} // Ajoutez ceci
              isLiked={video.hasLiked}
              isNotInterested={video.hasNotInterested} // Ajoutez ceci
              ref={(el) => (videoRefs.current[index] = el)}
            />
          </div>
        );
      })}
      {isFetching && (
        <p
          style={{
            position: 'absolute',
            bottom: 10,
            width: '100%',
            textAlign: 'center',
          }}
        >
          Chargement des vidéos...
        </p>
      )}
    </div>
  );
  
};

export default VideoContainer;
