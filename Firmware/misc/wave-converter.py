import argparse
import wave
import audioop
import os

def convert_wav(input_path, output_path, target_rate, target_width, target_channels):
    # Open source WAV
    with wave.open(input_path, 'rb') as wf:
        in_channels = wf.getnchannels()
        in_width = wf.getsampwidth()
        in_rate = wf.getframerate()
        frames = wf.readframes(wf.getnframes())
    
    # Convert sample width if needed
    if in_width != target_width:
        print(f"Converting sample width from {in_width*8}-bit to {target_width*8}-bit.")
        frames = audioop.lin2lin(frames, in_width, target_width)
    
    # Convert channels if needed
    if in_channels != target_channels:
        if target_channels == 2:
            print("Duplicating mono to stereo.")
            frames = audioop.tostereo(frames, target_width, 1, 1)
        else:
            print("Downmixing stereo to mono.")
            frames = audioop.tomono(frames, target_width, 0.5, 0.5)
    
    # Resample if needed
    if in_rate != target_rate:
        print(f"Resampling from {in_rate} Hz to {target_rate} Hz.")
        frames, _ = audioop.ratecv(frames, target_width, target_channels, in_rate, target_rate, None)
    
    # Write raw PCM output
    with open(output_path, 'wb') as outf:
        outf.write(frames)
    print(f"Converted file saved to {output_path}")

def main():
    parser = argparse.ArgumentParser(
        description="Convert WAV to raw PCM format for Raspberry Pi Pico 2W"
    )
    parser.add_argument("input_wav", help="Path to input WAV file")
    parser.add_argument("output_raw", nargs='?',
                        help="Path to output raw PCM file (default: same name with .raw)")
    parser.add_argument("--rate", type=int, default=44100,
                        help="Target sample rate in Hz (default: 44100)")
    parser.add_argument("--width", type=int, choices=[1,2,3,4], default=2,
                        help="Target sample width in bytes (default: 2 for 16-bit)")
    parser.add_argument("--channels", type=int, choices=[1,2], default=2,
                        help="Target number of channels (1=mono, 2=stereo) (default: 2)")
    args = parser.parse_args()

    input_path = args.input_wav
    if args.output_raw:
        output_path = args.output_raw
    else:
        base, _ = os.path.splitext(input_path)
        output_path = base + ".raw"

    convert_wav(input_path, output_path, args.rate, args.width, args.channels)

if __name__ == "__main__":
    main()
