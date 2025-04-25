# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long
# questestimation.py
from psychopy import data

class QuestEstimation:
    def __init__(self, startVal=0.5, startValSd=0.2, pThreshold=0.82, minVal=0, maxVal=1, n_trials = 50):
        self.quest = data.QuestHandler(startVal=startVal, startValSd=startValSd, pThreshold=pThreshold, minVal=minVal, maxVal=maxVal, nTrials=n_trials)

    def suggest_next_trial(self):
        return self.quest.next()

    def update(self, result):       
        self.quest.addResponse(result)
