# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long
# stereoaudioplayer.py

import os
import numpy as np
import soundfile as sf
import simpleaudio as sa
import tempfile
import time

class AudioManager:
    def __init__(self):
        self.currently_playing = None

    def request_play(self, player):
        if self.currently_playing is not None:
            self.currently_playing.stop()
        self.currently_playing = player

class StereoAudioPlayer:
    def __init__(self, left_channel_file, right_channel_file, amp_left=1.0, amp_right=1.0):

        # Initialize
        left_data = None
        right_data = None
        left_rate = 22050
        right_rate = 22050

        # Load left channel
        if left_channel_file:
            if not os.path.isfile(left_channel_file):
                raise ValueError(f"File {left_channel_file} does not exist")
            left_data, left_rate = sf.read(left_channel_file)

        # Load right channel
        if right_channel_file:
            if not os.path.isfile(right_channel_file):
                raise ValueError(f"File {right_channel_file} does not exist")
            right_data, right_rate = sf.read(right_channel_file)

        # Validate inputs
        if left_data is None and right_data is None:
            raise ValueError("Both files cannot be None")
        if left_rate != right_rate:
            raise ValueError("Sample rates must match")

        # Generate silence if channel is None
        if left_data is None:
            left_data = np.zeros(len(right_data))
        elif right_data is None:
            right_data = np.zeros(len(left_data))

        # Set amplitudes
        self.amp_left = amp_left
        self.amp_right = amp_right

        # Print amplitudes for debugging
        print(f"Left amplitude: {amp_left}")
        print(f"Right amplitude: {amp_right}")

        # Make channels equal length
        length = max(len(left_data), len(right_data))
        left_data = left_data[:length]
        right_data = right_data[:length]

        # Interleave and normalize
        self.audio_data = np.vstack([left_data, right_data]).T
        self.audio_data /= np.max(np.abs(self.audio_data))
        self.audio_data = self.audio_data.astype(np.float32)


    def play(self, audio_manager):
        # Adjust amplitudes
        adjusted_audio_data = np.copy(self.audio_data)
        adjusted_audio_data[:,0] *= self.amp_left
        adjusted_audio_data[:,1] *= self.amp_right

        audio_manager.request_play(self)
        
        # Write to temporary WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            sf.write(temp_wav.name, adjusted_audio_data, 22050, 'PCM_24')

            # Load as WaveObject and play
            self.play_obj = sa.WaveObject.from_wave_file(temp_wav.name).play()
        
        # Wait for the audio to finish playing
        while self.play_obj.is_playing():
            time.sleep(0.1)

    def stop(self):
        if self.play_obj is not None:
            self.play_obj.stop()
        else:
            raise RuntimeError("No audio is currently playing.")


