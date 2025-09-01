## ABXTester : Experiment Runner

### 1) Overview
ABXTester is a local Flask web app for running audio psychophysics experiments that combine:
- QUEST threshold estimation to calibrate the stochastic-resonance (SR) noise level
- ABX trials over a texture dataset
- Durable CSV/JSON logging

Core modules
- managers/flaskapp.py : Minimal page queue and event routing to Jinja2 templates
- managers/stereoaudioplayer.py : Two‑channel playback (soundfile + simpleaudio) with independent gains
- managers/questestimation.py : QUEST wrapper (max trials, start value)
- managers/experimentreader.py : CSV‑driven condition sequencing
- managers/atomicwriter.py : Atomic appends for results files

Data layout (relative to ABXTester/)

``` Note: This data is not included because of IP. Please contact the author for more information. ```
- dataset/v2024dataset.csv : Trial/experiment conditions
- media/textures/ : Left‑channel textures (WAV)
- dataset/stochastic_noise.wav : Right‑channel SR noise (WAV)
- results/ : Output CSV and QUEST JSON snapshots



Entry point: main.py orchestrates page flow (instructions → QUEST → trial → experiment → survey) and wires event handlers.

### 2) How to deploy/run
Prerequisites
- Conda/Miniconda
- Working audio output device
- Windows is the primary target (env includes pywin32/pypiwin32); Linux/macOS may work with minor tweaks

Steps
1. Environment
   - conda env create -f environment.yml
   - conda activate abx_tester
2. Assets
   - Ensure dataset/v2024dataset.csv, dataset/stochastic_noise.wav, and media/textures/* exist
   - Create results/ directory if missing
3. Launch
   - python main.py <PARTICIPANT_ID>
   - Open http://127.0.0.1:5000
4. Operation
   - Use the web UI; app posts to /event and advances pages via a queue
   - Outputs: results/<PARTICIPANT_ID>_experiment_results.csv and <PARTICIPANT_ID>_quest_results.csv (+ .json)

Notes
- Sample rates must match between the two input WAVs; the player enforces this
- Right channel SR amplitude is QUEST_MEAN × SRPresentationLVL (per trial row)

### 3) Where it has been tested
- Windows 10/11 with Anaconda/Miniconda
- Python 3.11 as pinned in environment.yml
- Chromium‑based browsers locally
- simpleaudio backend (WASAPI/DirectSound on Windows)

### 4) History and rationale (commit highlights)
- d90c32e (ABXTester): Initial Flask app with audio playback, CSV I/O, QUEST, and templates : goal: unify thresholding and ABX in a lightweight local runner with durable logging
- Environment pinned in environment.yml for reproducible audio/science stacks (NumPy/SciPy/Librosa/simpleaudio/PsychoPy)

Design choices
- Minimal Flask wrapper (page queue + event routing) for easy experiment customization
- Atomic writes to prevent truncated CSVs in the presence of interruptions
- Explicit media/dataset layout to separate stimuli from code

### 5) Brief technical summary
- Language: Python 3.11
- Frameworks/Libraries: Flask + Jinja2, NumPy, soundfile (libsndfile), simpleaudio, pandas, pytz
- Architecture: Single‑process Flask; event‑driven page transitions; synchronous audio playback guarded by a simple AudioManager
- I/O: CSV conditions → in‑memory row; responses → atomic CSV + QUEST JSON snapshots



# Conda Environment Setup for ABX Tester Project

This guide will help you set up a Conda environment for the ABX Tester project using the `environment.yml` file.

## Prerequisites

- [Anaconda](https://www.anaconda.com/products/individual) or [Miniconda](https://docs.conda.io/en/latest/miniconda.html) installed on your system.

## Setup Steps

### 1. Clone the Project Repository (if applicable)

If your project is in a Git repository, clone it using the command below. Otherwise, navigate to your project directory.

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Create the Conda Environment

Create the Conda environment from the provided `environment.yml` file:

```bash
conda env create -f environment.yml
```

This will:
- Create a new Conda environment named `abx_tester`.
- Install all the necessary dependencies listed in the `environment.yml` file using Conda and pip.

### 3. Activate the Environment

After the environment is created, activate it with the following command:

```bash
conda activate abx_tester
```

### 4. Verify the Installation

To verify that everything is installed correctly, you can run a simple Python script that imports all the required libraries:

```python
import numpy
import pandas
import scipy
import matplotlib
import seaborn
import librosa
import soundfile
import sklearn
import pytz
import flask
import psychopy
import simpleaudio

print("All libraries imported successfully!")
```

Save this script as `test_imports.py` and run it:

```bash
python test_imports.py
```

If you see the success message without any errors, your environment is set up correctly.

### 5. Updating the Environment

If new dependencies are added to the project in the future, you can update the environment by running:

```bash
conda env update --file environment.yml --prune
```

This will install any new dependencies and remove packages no longer required.

### 6. Removing the Environment

If you ever need to remove the Conda environment, you can do so with:

```bash
conda remove --name abx_tester --all
```

## Troubleshooting

- **If you encounter issues with PyAudio**, you might need to install `portaudio`:
  ```bash
  conda install -c anaconda portaudio
  ```

- **For issues with PsychoPy**, you can try reinstalling it:
  ```bash
  conda install -c conda-forge psychopy
  ```

- **On Windows**, if you encounter issues with `librosa`, try installing `numpy` with MKL:
  ```bash
  conda install -c conda-forge numpy=1.21
  ```

## Environment Overview

### `environment.yml` Contents:
```yaml
name: abx_tester
channels:
  - defaults
  - conda-forge
dependencies:
  - python=3.8
  - numpy
  - pandas
  - matplotlib
  - seaborn
  - scipy
  - soundfile
  - psychopy
  - librosa
  - flask
  - scikit-learn
  - pip
  - pip:
      - simpleaudio
      - pytz
```

This file lists the Conda and pip packages needed to run the project. Conda will install the core libraries, while pip will handle the few additional Python-only packages.