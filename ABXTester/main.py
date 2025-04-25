# pylint: disable=missing-class-docstring,missing-function-docstring,missing-module-docstring,line-too-long,W0603
# main.py
import sys
import pytz
from datetime import datetime
from managers.stereoaudioplayer import StereoAudioPlayer, AudioManager
from managers.experimentreader import ExperimentReader
from managers.atomicwriter import AtomicCSVWriter
from managers.questestimation import QuestEstimation
from managers.flaskapp import FlaskApp


# Application Constants
QUEST_MAX_TRIALS = 50
TEXTURE_AUDIO_LEVEL = 1
TRIAL_ROWS = 4
EXPT_RESULTS_FOLDER = './results/'
EXPT_RESULTS_FILE = '_experiment_results.csv'
QUEST_RESULTS_FILE = '_quest_results.csv'
EXPT_CONDITIONS_FILE = './dataset/v2024dataset.csv'
SR_NOISE_FILE = './dataset/stochastic_noise.wav'
TEXTURE_FOLDER = './media/textures/'

# Global Variables
QUEST_MEAN = 0.0
QUEST_QUANTILE_50 = 0.0
PARTICIPANT_ID = ''
TRIAL_COUNT = 0
QUEST_START_VAL = 0.5
PREV_TIME = datetime.now(pytz.timezone('US/Pacific'))


audio_manager = AudioManager()
experiment_reader = ExperimentReader(EXPT_CONDITIONS_FILE)
writer = AtomicCSVWriter()
quest_estimation = QuestEstimation(n_trials=QUEST_MAX_TRIALS, startVal=QUEST_START_VAL)


app = FlaskApp()


# writer.write(csv_row, additional_param1='value3', additional_param2='value4')
#print(reader.current_row['A'])#

def quest_initial_play():
    quest_player = StereoAudioPlayer(left_channel_file=None, right_channel_file=SR_NOISE_FILE, amp_left=0.0, amp_right=QUEST_START_VAL)
    quest_player.play(audio_manager)

def default_next_page_handler(data):
    print("Next page handler called with data:", data)
    return True

def pre_quest_next_page_handler(data):
    print("Next page handler called with data:", data)
    quest_initial_play()
    return True

def quest_response_handler(data):
    print("quest_response_handler called with data:", data)
    global TRIAL_COUNT
    if TRIAL_COUNT < QUEST_MAX_TRIALS:
        trial = quest_estimation.suggest_next_trial()
        quest_player = StereoAudioPlayer(left_channel_file=None, right_channel_file=SR_NOISE_FILE, amp_left=0.0, amp_right=trial)
        quest_player.play(audio_manager)
        response_map = {'yes': 1, 'no': 0}
        result = response_map[data['response'].lower()]
        quest_estimation.update(result)
        return_value = "inprogress"
    else:
        global QUEST_MEAN
        global QUEST_QUANTILE_50
        QUEST_MEAN = quest_estimation.quest.mean()
        QUEST_QUANTILE_50 = quest_estimation.quest.quantile(0.5)
        quest_estimation.quest.saveAsJson(fileName=EXPT_RESULTS_FOLDER + str(PARTICIPANT_ID) + QUEST_RESULTS_FILE+".json")
        quest_estimation.quest.saveAsText(fileName=EXPT_RESULTS_FOLDER + str(PARTICIPANT_ID) + QUEST_RESULTS_FILE , delim=',')
        return_value = "complete"
    TRIAL_COUNT += 1
    return {"result":return_value}, 200


def abx_player_request_handler(data):
    print("abx_player_request_handler called with data:", data)
    signal_request = data['button']
    if signal_request == 'X':
        signal_file_reference = experiment_reader.current_row['X']
        signal_file = experiment_reader.current_row[signal_file_reference]
    else:
        signal_file = experiment_reader.current_row[signal_request]
    current_sr_level = experiment_reader.current_row['SRPresentationLVL']
    leftFile = TEXTURE_FOLDER + signal_file
    abx_player = StereoAudioPlayer(left_channel_file=leftFile, right_channel_file=SR_NOISE_FILE, amp_left=TEXTURE_AUDIO_LEVEL, amp_right=QUEST_MEAN*float(current_sr_level))
    abx_player.play(audio_manager)
    return {"status":'playing signal'+signal_request}


def abx_response_trial_handler(data):
    print("abx_response_handler called with data:", data)
    selection = data['selection']
    current_time_pst = datetime.now(pytz.timezone('US/Pacific'))
    global PREV_TIME
    elapsed_time = current_time_pst - PREV_TIME
    PREV_TIME = current_time_pst
    writer.write(directory=EXPT_RESULTS_FOLDER, filename=str(PARTICIPANT_ID) + EXPT_RESULTS_FILE, row=experiment_reader.current_row, user_response=selection, type='trial', partID=PARTICIPANT_ID, questMean=QUEST_MEAN, questQuantile50=QUEST_QUANTILE_50, computed_sr_level=QUEST_MEAN*float(experiment_reader.current_row['SRPresentationLVL']), time_stamp = current_time_pst.strftime("%Y-%m-%d %H:%M:%S"), elapsed_time=elapsed_time.total_seconds())
    experiment_reader.next_row()
    if experiment_reader.current_row is None or experiment_reader.row_index >= TRIAL_ROWS:
        return {"result":"complete"}, 200
    else:
        return {"result":"inprogress"}, 200
    

def abx_response_expt_handler(data):
    print("abx_response_handler called with data:", data)
    selection = data['selection']
    current_time_pst = datetime.now(pytz.timezone('US/Pacific'))
    global PREV_TIME
    elapsed_time = current_time_pst - PREV_TIME
    PREV_TIME = current_time_pst
    writer.write(directory=EXPT_RESULTS_FOLDER, filename=str(PARTICIPANT_ID) + EXPT_RESULTS_FILE, row=experiment_reader.current_row, user_response=selection, type='experiment', partID=PARTICIPANT_ID, questMean=QUEST_MEAN, questQuantile50=QUEST_QUANTILE_50, computed_sr_level=QUEST_MEAN*float(experiment_reader.current_row['SRPresentationLVL']), time_stamp = current_time_pst.strftime("%Y-%m-%d %H:%M:%S"), elapsed_time=elapsed_time.total_seconds())
    experiment_reader.next_row()
    if experiment_reader.current_row is None:
        return {"result":"complete"}, 200
    else:
        return {"result":"inprogress"}, 200

def main(part_id):
    print("ID received:", part_id)
    global PARTICIPANT_ID
    PARTICIPANT_ID = part_id
    app.add_page({'template': 'initial_qualtrics.html', 'events': {'nextpage': default_next_page_handler}},participant_id=part_id)
    app.add_page({'template': 'initial_instructions.html', 'events': {'nextpage': pre_quest_next_page_handler}})
    app.add_page({'template': 'quest_estimation.html', 'events': {'nextpage': default_next_page_handler, 'quest_response': quest_response_handler}})
    app.add_page({'template': 'trial_instructions.html', 'events': {'nextpage': default_next_page_handler}})
    app.add_page({'template': 'trial.html', 'events': {'nextpage': default_next_page_handler, 'trial_response': abx_response_trial_handler, 'abx_play_request': abx_player_request_handler}})
    app.add_page({'template': 'expt_instructions.html', 'events': {'nextpage': default_next_page_handler}})
    app.add_page({'template': 'experiment.html', 'events': {'nextpage': default_next_page_handler, 'experiment_response': abx_response_expt_handler, 'abx_play_request': abx_player_request_handler}})
    app.add_page({'template': 'post_experiment_qualtrics.html', 'events': {'nextpage': default_next_page_handler}},participant_id=part_id)
    app.add_page({'template': 'thankyou.html', 'events': {'nextpage': default_next_page_handler}})
    app.run()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: ID parameter is required. Exiting.")
        sys.exit(1)
    else:
        main(sys.argv[1])

