
# Conda Environment Setup for Audio Analysis Project

This guide will help you set up a Conda environment for the Audio Analysis project using the `environment.yml` file.

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
- Create a new Conda environment named `audio_analysis`.
- Install all the necessary dependencies listed in the `environment.yml` file using Conda and pip.

### 3. Activate the Environment

After the environment is created, activate it with the following command:

```bash
conda activate audio_analysis
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
conda remove --name audio_analysis --all
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
name: audio_analysis
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