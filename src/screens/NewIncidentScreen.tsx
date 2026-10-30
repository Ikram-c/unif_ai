import React, { useState } from 'react';
import { Card, PrimaryButton, SecondaryButton, PrivateByDefaultNotice, StepHeader } from '../components/Common';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface NewIncidentScreenProps {
  initialValues: {
    mission_name: string;
    mission_reference: string;
    agency: string;
    commander_reference: string;
    subject_reference: string;
  };
  onCancel: () => void;
  onNext: (values: {
    mission_name: string;
    mission_reference: string;
    agency: string;
    commander_reference: string;
    subject_reference: string;
  }) => void;
}

export const NewIncidentScreen: React.FC<NewIncidentScreenProps> = ({
  initialValues,
  onCancel,
  onNext,
}) => {
  const [missionName, setMissionName] = useState(initialValues.mission_name || 'Bannau Brycheiniog');
  const [missionRef, setMissionRef] = useState(initialValues.mission_reference || 'SAR-027');
  const [agency, setAgency] = useState(initialValues.agency || 'Upland SAR · Example agency');
  const [commanderRef, setCommanderRef] = useState(initialValues.commander_reference || 'C-01');
  const [subjectRef, setSubjectRef] = useState(initialValues.subject_reference || 'Subject S-01');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      mission_name: missionName,
      mission_reference: missionRef,
      agency,
      commander_reference: commanderRef,
      subject_reference: subjectRef,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F5] overflow-y-auto hig-scroll-view">
      <StepHeader stepNumber="02 / 09" stepTitle="SETUP 1 OF 3" missionRef={missionRef} />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-8 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
            New incident setup
          </h1>
          <p className="text-xs text-[#5A706A] mt-0.5">
            Step 1 of 3 · Initialize mission audit file and dispatch references
          </p>
        </div>

        <Card className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
              Mission Name
            </label>
            <input
              type="text"
              required
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="e.g. Bannau Brycheiniog"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] focus:ring-1 focus:ring-[#0B6758] bg-[#F4F6F5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                Mission Reference
              </label>
              <input
                type="text"
                required
                value={missionRef}
                onChange={(e) => setMissionRef(e.target.value)}
                placeholder="e.g. SAR-026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] focus:ring-1 focus:ring-[#0B6758] bg-[#F4F6F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                Dispatch / Agency
              </label>
              <input
                type="text"
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="e.g. Upland SAR · Example agency"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] focus:ring-1 focus:ring-[#0B6758] bg-[#F4F6F5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                Commander Reference
              </label>
              <input
                type="text"
                required
                value={commanderRef}
                onChange={(e) => setCommanderRef(e.target.value)}
                placeholder="e.g. C-01"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] focus:ring-1 focus:ring-[#0B6758] bg-[#F4F6F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                Subject Reference
              </label>
              <input
                type="text"
                required
                value={subjectRef}
                onChange={(e) => setSubjectRef(e.target.value)}
                placeholder="e.g. Subject S-01"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] focus:ring-1 focus:ring-[#0B6758] bg-[#F4F6F5]"
              />
            </div>
          </div>
        </Card>

        <PrivateByDefaultNotice />

        <div className="flex items-center justify-between pt-2">
          <SecondaryButton onClick={onCancel} icon={<ArrowLeft size={16} />}>
            Back to workspace
          </SecondaryButton>
          <PrimaryButton type="submit" icon={<ArrowRight size={16} />}>
            Next: Last-known location
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
