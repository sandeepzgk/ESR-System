# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long
# experimentreader.py
import csv
import random

class ExperimentReader:
    def __init__(self, filename):
        self.filename = filename
        self.data = []
        self.current_row = None
        self.row_index = -1
        self.load_data()
        self.next_row()  # Load the first row right after initialization

    def load_data(self):
        """Loads data from the CSV file and processes it."""
        with open(self.filename, 'r', encoding="utf-8") as file:
            reader = csv.DictReader(file)
            data = [row for row in reader]

        # Process data to meet the requirements
        self.data = self.process_data(data)

        # Print the randomized trial order including trial values
        trial_order = [row['#'] for row in self.data]
        print(','.join(trial_order))

    def process_data(self, data):
        """Separates T1-T4 trials, shuffles the rest, and combines them."""
        # Separate T1-T4 and the rest
        t_trials = [row for row in data if row['#'].startswith('T')]
        rest_trials = [row for row in data if not row['#'].startswith('T')]

        # Shuffle the rest of the trials
        random.shuffle(rest_trials)

        # Combine T1-T4 with the shuffled rest
        combined_data = t_trials + rest_trials
        return combined_data

    def next_row(self):
        """Advances to the next row in the data."""
        self.row_index += 1
        if self.row_index < len(self.data):
            self.current_row = self.data[self.row_index]
        else:
            self.current_row = None
        return self.current_row
