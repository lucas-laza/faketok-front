import React from 'react';
import VideoContainer from './Components/VideoContainer';

// Importation explicite des vidéos
import vid1 from './assets/vid1.mp4';
import vid2 from './assets/vid2.mp4';
import vid3 from './assets/vid3.mp4';

const App = () => {
    const videoUrls = [vid1, vid2, vid3];

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <VideoContainer videoUrls={videoUrls} />
        </div>
    );
};

export default App;
