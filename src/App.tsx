import React, { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { LocationStepScreen } from './screens/LocationStepScreen';
import { MapPickerScreen } from './screens/MapPickerScreen';
import { TravelModeScreen } from './screens/TravelModeScreen';
import { LastSeenScreen } from './screens/LastSeenScreen';
import { BeginModelScreen } from './screens/BeginModelScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { RescueListScreen } from './screens/RescueListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GeoPosition, Rescue, SubjectProfile, TravelMode } from './types';
import { rescueRepository } from './data/RescueRepository';
import { settingsStore } from './data/SettingsStore';
import { TimeFormat } from './core/TimeFormat';

type Screen =
  | 'HOME'
  | 'NEW_LOCATION'
  | 'NEW_MAP'
  | 'NEW_MODE'
  | 'NEW_TIME'
  | 'NEW_BEGIN'
  | 'RESULTS'
  | 'ONGOING'
  | 'COMPLETED'
  | 'SETTINGS';

interface WizardState {
  pin: GeoPosition | null;
  locationLabel: string;
  travelMode: TravelMode;
  date: string;
  time: string;
  timeZone: string;
  subject: SubjectProfile;
  running: boolean;
  progress: string;
  error: string | null;
}

const getInitialWizard = (): WizardState => {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
  const dateStr = threeHoursAgo.toISOString().slice(0, 10);
  const timeStr = `${String(threeHoursAgo.getUTCHours()).padStart(2, '0')}:${String(threeHoursAgo.getUTCMinutes()).padStart(2, '0')}`;

  return {
    pin: rescueRepository.demoDataset.defaultPin,
    locationLabel: 'Elenydd, Cambrian Mountains',
    travelMode: 'ON_FOOT',
    date: dateStr,
    time: timeStr,
    timeZone: settingsStore.settings.timeZone || 'UTC',
    subject: {
      name: '',
      age: null,
      fitness: 'MEDIUM',
      experience: 'INTERMEDIATE',
      clothing: '',
      notes: '',
    },
    running: false,
    progress: '',
    error: null,
  };
};

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [selectedRescueId, setSelectedRescueId] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>(getInitialWizard());

  const handleStartNewRescue = () => {
    setWizard(getInitialWizard());
    setCurrentScreen('NEW_LOCATION');
  };

  const handleBeginModel = async () => {
    if (!wizard.pin) {
      setWizard((w) => ({ ...w, error: 'Please specify a last known location' }));
      return;
    }

    setWizard((w) => ({
      ...w,
      running: true,
      error: null,
      progress: 'Computing search window',
    }));

    try {
      const [year, month, day] = wizard.date.split('-').map((v) => parseInt(v, 10));
      const [hour, min] = wizard.time.split(':').map((v) => parseInt(v, 10));
      const lastSeenDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      const now = new Date();

      const newRescue: Rescue = {
        id: `rescue-${Date.now()}`,
        status: 'ONGOING',
        created_at_utc: TimeFormat.format(now),
        last_known_location: wizard.pin,
        location_label: wizard.locationLabel,
        travel_mode: wizard.travelMode,
        last_seen_utc: TimeFormat.format(lastSeenDate),
        time_zone: wizard.timeZone,
        subject: wizard.subject,
      };

      await new Promise((r) => setTimeout(r, 450));
      setWizard((w) => ({ ...w, progress: 'Querying satellite, UAV and dashcam metadata' }));

      const planned = await rescueRepository.runModel(newRescue, now);

      setWizard((w) => ({ ...w, progress: 'Scoring cells, equipment and team size' }));
      await new Promise((r) => setTimeout(r, 450));

      setWizard((w) => ({ ...w, running: false, progress: '' }));
      setSelectedRescueId(planned.id);
      setCurrentScreen('RESULTS');
    } catch (e: any) {
      setWizard((w) => ({
        ...w,
        running: false,
        error: e?.message || 'Model execution failed',
      }));
    }
  };

  // Render current active screen
  switch (currentScreen) {
    case 'HOME':
      return (
        <HomeScreen
          onNewRescue={handleStartNewRescue}
          onOngoing={() => setCurrentScreen('ONGOING')}
          onCompleted={() => setCurrentScreen('COMPLETED')}
          onSettings={() => setCurrentScreen('SETTINGS')}
        />
      );

    case 'NEW_LOCATION':
      return (
        <LocationStepScreen
          pin={wizard.pin}
          locationLabel={wizard.locationLabel}
          onOpenMap={() => setCurrentScreen('NEW_MAP')}
          onConfirm={() => setCurrentScreen('NEW_MODE')}
          onBack={() => setCurrentScreen('HOME')}
        />
      );

    case 'NEW_MAP':
      return (
        <MapPickerScreen
          initialPin={wizard.pin}
          onConfirm={(pin, label) => {
            setWizard((w) => ({ ...w, pin, locationLabel: label }));
            setCurrentScreen('NEW_MODE');
          }}
          onBack={() => setCurrentScreen('NEW_LOCATION')}
        />
      );

    case 'NEW_MODE':
      return (
        <TravelModeScreen
          mode={wizard.travelMode}
          onChangeMode={(mode) => setWizard((w) => ({ ...w, travelMode: mode }))}
          onConfirm={() => setCurrentScreen('NEW_TIME')}
          onBack={() => setCurrentScreen('NEW_LOCATION')}
        />
      );

    case 'NEW_TIME':
      return (
        <LastSeenScreen
          date={wizard.date}
          time={wizard.time}
          timeZone={wizard.timeZone}
          onDateChange={(date) => setWizard((w) => ({ ...w, date }))}
          onTimeChange={(time) => setWizard((w) => ({ ...w, time }))}
          onTimeZoneChange={(timeZone) => setWizard((w) => ({ ...w, timeZone }))}
          onConfirm={() => setCurrentScreen('NEW_BEGIN')}
          onBack={() => setCurrentScreen('NEW_MODE')}
        />
      );

    case 'NEW_BEGIN':
      return (
        <BeginModelScreen
          pin={wizard.pin || rescueRepository.demoDataset.defaultPin}
          locationLabel={wizard.locationLabel}
          travelMode={wizard.travelMode}
          lastSeenTime={wizard.time}
          timeZone={wizard.timeZone}
          subject={wizard.subject}
          running={wizard.running}
          progress={wizard.progress}
          error={wizard.error}
          onUpdateSubject={(subject) => setWizard((w) => ({ ...w, subject }))}
          onBeginModel={handleBeginModel}
          onBack={() => setCurrentScreen('NEW_TIME')}
        />
      );

    case 'RESULTS': {
      const rescue = selectedRescueId ? rescueRepository.find(selectedRescueId) : null;
      if (!rescue) {
        return (
          <HomeScreen
            onNewRescue={handleStartNewRescue}
            onOngoing={() => setCurrentScreen('ONGOING')}
            onCompleted={() => setCurrentScreen('COMPLETED')}
            onSettings={() => setCurrentScreen('SETTINGS')}
          />
        );
      }
      return (
        <ResultsScreen
          rescue={rescue}
          onBack={() => setCurrentScreen('HOME')}
        />
      );
    }

    case 'ONGOING':
      return (
        <RescueListScreen
          status="ONGOING"
          onOpenRescue={(id) => {
            setSelectedRescueId(id);
            setCurrentScreen('RESULTS');
          }}
          onBack={() => setCurrentScreen('HOME')}
        />
      );

    case 'COMPLETED':
      return (
        <RescueListScreen
          status="COMPLETED"
          onOpenRescue={(id) => {
            setSelectedRescueId(id);
            setCurrentScreen('RESULTS');
          }}
          onBack={() => setCurrentScreen('HOME')}
        />
      );

    case 'SETTINGS':
      return <SettingsScreen onBack={() => setCurrentScreen('HOME')} />;

    default:
      return (
        <HomeScreen
          onNewRescue={handleStartNewRescue}
          onOngoing={() => setCurrentScreen('ONGOING')}
          onCompleted={() => setCurrentScreen('COMPLETED')}
          onSettings={() => setCurrentScreen('SETTINGS')}
        />
      );
  }
};

export default App;
