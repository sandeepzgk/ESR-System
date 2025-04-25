# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long
# flaskapp.py

import logging
import os
from queue import Queue
from flask import Flask, render_template, request, send_from_directory

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__, template_folder='../templates', static_folder='../static')
        self.pages = Queue()
        self.active_page = None
        self.participant_id = None

        @self.app.route('/', methods=['GET'])
        def root():
            # If there is no active page, try to get one from the queue
            if self.active_page is None and not self.pages.empty():
                self.active_page = self.pages.get()
            # If there is still no active page, return an error
            elif self.active_page is None:
                return 'No pages have been added', 500
            # If there is an active page, render it
            return render_template(self.active_page['template'], participant_id=self.participant_id)


        @self.app.route('/event', methods=['POST'])
        def event():
            if self.active_page is None:
                return 'No active page', 500
            event_name = request.json.get('event')
            handler = self.active_page['events'].get(event_name)
            if handler is None:
                logging.error('############ ERROR ############ : Unknown event %s', event_name)
                return 'Unknown event', 500
            try:
                result = handler(request.json)
                print("Result:", result)
                if event_name == 'nextpage' and result and not self.pages.empty():
                    self.active_page = self.pages.get()
                    return render_template(self.active_page['template'], participant_id=self.participant_id)
                return result
            except (ValueError, TypeError) as exception:
                logging.error('############ ERROR ############ : Exception in handler for event %s: %s', event_name, exception)
                return 'Exception in handler', 500            

        @self.app.route('/static/<path:filename>')
        def serve_static(filename):
            print("Serving static file:", filename)
            return send_from_directory(self.app.static_folder, filename)

    def add_page(self, page, participant_id=None):
        if participant_id is not None:
            self.participant_id = participant_id
        self.pages.put(page)

    def run(self, host='127.0.0.1', port=5000):
        self.app.config['EXPLAIN_TEMPLATE_LOADING'] = True # for debugging
        self.app.run(host=host, port=port,debug=True)
