import React, {useState, useEffect} from 'react';
import './App.css';

import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({log: true});

function App() {
    const [ready, setReady] = useState(false);
    const [video, setVideo] = useState();
    const [output, setOutput] = useState();
    const [frames, setFrames] = useState();

    const load = async () => {
        await ffmpeg.load();
        setReady(true);
    };

    useEffect(() => {
        load().then(() => console.log('FFMPEG-WASM LOADED'));
    }, []);

    const convertAndGenerateFrames = async () => {
        await convertToMP4();
        await generateFrames();
    }

    const convertToMP4 = async () => {
        // Write the file to memory
        ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

        // Run the FFMpeg command
        await ffmpeg.run('-i', 'test.mp4', '-f', 'mp4', 'out.mov');

        // Read the result
        const data = ffmpeg.FS('readFile', 'out.mov');

        // Create a URL
        const url = URL.createObjectURL(new Blob([data.buffer], {type: 'video/mov'}));
        setOutput(url);
    };

    const generateFrames = async () => {
        // Write the file to memory
        ffmpeg.FS('writeFile', 'test.mp4', await fetchFile(video));

        // Run the FFMpeg command
        await ffmpeg.run('-i', 'test.mp4', '-vf', 'fps=1', 'outputFile-%03d.png');

        const seconds = 100; // Taking a big number
        const urls = [];

        for (let i = 0; i < seconds; i++) {
            try {
                // Read the result
                const data = ffmpeg.FS('readFile', `outputFile-00${i + 1}.png`);

                // // Create a URL
                const url = URL.createObjectURL(new Blob([data.buffer], {type: 'image/png'}));
                urls.push(url);
            } catch (e) {
                console.log('error getting image');
            }
        }
        setFrames(urls);
    };

    return ready ? <>
            <div className='App'>
                {video && <video
                    controls
                    width='250'
                    src={URL.createObjectURL(video)}>

                </video>}


                <input type='file' onChange={(e) => setVideo(e.target.files?.item(0))}/>

                <h3>Result</h3>

                {/*<button onClick={convertToMP4}>Convert</button>*/}
                {/*<button onClick={generateFrames}>Generate Frames</button>*/}
                <button onClick={convertAndGenerateFrames}>Convert & Generate Frames</button>

                {output && <video
                    controls
                    width='250'
                    src={output}>

                </video>}

                <div className={'frameContainer'}>
                    {frames && Array.isArray(frames) && frames.map((url, index) => <img
                        width={'250'}
                        key={index}
                        src={url}
                        alt={'Frame' + index}
                    >
                    </img>)}
                </div>

            </div>
        </>
        :
        <p>Loading...</p>;
}

export default App;
