import os

class RawFilePlayer:
    """
    Triple-buffered raw PCM file player with per-buffer byte offset tracking to avoid glitches.
    Assumes the input is a raw PCM file with interleaved samples.

    Audio format parameters (sample_rate, bits_per_sample, channels) are read from config["audio"].
    """
    def __init__(self, filename, config):
        self.config = config
        self.audio_cfg = config["audio"]
        self.filename = filename

        # Audio parameters
        self.sample_rate = self.audio_cfg["sample_rate"]
        self.bits_per_sample = self.audio_cfg["bits_per_sample"]
        # Default to stereo if not specified
        self.channels = self.audio_cfg.get("channels", 2)

        # Compute sizes
        self.sample_size = self.bits_per_sample // 8
        self.frame_size = self.sample_size * self.channels  # bytes per frame

        # Open raw PCM file and determine its size
        self.file = open(self.filename, "rb")
        self.file.seek(0, 2)
        self.data_size = self.file.tell()
        self.file.seek(0, 0)
        self.byte_position = 0

        # Triple-buffer storage
        self.buffers = [bytearray(), bytearray(), bytearray()]
        self.current = 0
        self.buf_bytes = 0

    def _read_chunk(self, pos, size):
        """
        Read 'size' bytes from file at byte offset 'pos', wrapping around if needed.
        """
        # Normalize position
        pos %= self.data_size
        # Seek and read as much as possible
        self.file.seek(pos)
        chunk = bytearray(self.file.read(size))
        # If we hit EOF before filling, wrap and continue reading
        while len(chunk) < size:
            need = size - len(chunk)
            self.file.seek(0)
            piece = self.file.read(min(self.data_size, need))
            if not piece:
                break
            chunk.extend(piece)
        return bytes(chunk)

    def generate_buffer(self, desired_frames):
        """
        Returns a memoryview for the next stereo buffer of 'desired_frames'.
        """
        num_bytes = desired_frames * self.frame_size

        # On first call or if frame size changed, refill all three buffers
        if self.buf_bytes != num_bytes:
            self.buf_bytes = num_bytes
            for i in range(3):
                pos = (self.byte_position + i * num_bytes) % self.data_size
                self.buffers[i] = self._read_chunk(pos, num_bytes)
            self.current = 0

        # Return the current buffer
        mv = memoryview(self.buffers[self.current])

        # Schedule refill of the buffer 2 steps ahead
        refill_idx = (self.current + 2) % 3
        next_pos = (self.byte_position + 2 * num_bytes) % self.data_size
        self.buffers[refill_idx] = self._read_chunk(next_pos, num_bytes)

        # Advance position and index
        self.byte_position = (self.byte_position + num_bytes) % self.data_size
        self.current = (self.current + 1) % 3

        return mv
