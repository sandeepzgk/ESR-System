# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long
# atomicwriter.py

import csv
import os

class AtomicCSVWriter:
    def __init__(self):
        pass

    def _write_to_file(self, file, fieldnames, row):
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        if file.tell() == 0:
            writer.writeheader()
        file.write('\n')
        writer.writerow(row)

    def _open_file(self, filename, directory, mode):
        filepath = os.path.join(directory, filename)
        is_empty = not os.path.exists(filepath) or os.stat(filepath).st_size == 0

        # If the file exists and is not empty, strip any trailing new lines
        if not is_empty:
            with open(filepath, 'r+', encoding='utf-8-sig') as f:
                f.seek(0, os.SEEK_END)
                pos = f.tell() - 1
                while pos > 0 and f.read(1) != "\n":
                    pos -= 1
                    f.seek(pos, os.SEEK_SET)
                if pos > 0:
                    f.seek(pos, os.SEEK_SET)
                    f.truncate()

        file = open(filepath, mode, newline='', encoding='utf-8-sig')  # added newline=''
        return file, is_empty

    def write(self, filename, directory, row, **kwargs):
        row.update(kwargs)

        # Open the existing file in append mode, check if it is empty
        file, is_empty = self._open_file(filename, directory, 'a')  # change is here
        if is_empty:
            # Write the header row and the current row
            self._write_to_file(file, row.keys(), row)
        else:
            # Append the new data
            self._write_to_file(file, row.keys(), row)
        file.close()  # remember to close the file when you're done with it
    