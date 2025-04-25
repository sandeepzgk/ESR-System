import time
import json
from hardware_controller import HardwareController
from wav_file_player import RawFilePlayer
import _thread 
from network_controller import WiFiController

def load_config():
    """Load configuration from config.json file."""
    try:
        with open('config.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print("Error loading config.json. Using default settings.", e)
        return {}

def main():
    # Load configuration settings
    config = load_config()

    # Initialize WiFi controller and start it on the second core
    wifi = WiFiController(config)
    wifi.start()

    # Initialize the hardware controller and blink the LED
    hw = HardwareController(config)
    hw.blink_led(5) # Blink LED 5 times to indicate startup
    time.sleep(0.5)

    # Initialize I2S hardware
    hw.initialize_i2s()

    # Create the raw PCM file player
    file_player = RawFilePlayer("my_sound.raw", config)

    #

    # Determine playback frames from config (fallback to buffer_length)
    adjusted_frames = config.get("audio", {}).get("playback_frames",
                            config.get("audio", {}).get("buffer_length", 1024))
    print(f"\nUsing playback_frames = {adjusted_frames}")

    # Main loop - check for requests from the WiFi controller
    while True:
        # Check for gain change requests
        gain_level = wifi.check_gain_request()
        if gain_level is not None:
            print(f"Setting amplifier gain to level {gain_level}")
            hw.set_gain(gain_level)
            
        # Check for play requests
        play_request = wifi.check_play_request()
        if play_request:
            # We have a play request - start audio playback
            duration = play_request['duration']
            volume = play_request['volume']
            
            print(f"Playing audio: duration={duration}s, volume={volume}")
            
            try:
                hw.play_audio(
                    wave_generator=file_player,
                    playback_frames=adjusted_frames,
                    aggregate_count=1,
                    debug=True,
                    duration_seconds=duration,
                    volume=volume
                )
            finally:
                # Mark playback as complete
                with wifi.play_request_lock:
                    wifi.audio_playing = False
                    
                    # Give other tasks a chance to run
                    time.sleep_ms(100)

if __name__ == "__main__":
    main()