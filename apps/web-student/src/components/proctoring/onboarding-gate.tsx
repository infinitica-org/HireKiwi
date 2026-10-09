'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Camera, ClipboardList, ShieldCheck } from 'lucide-react';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@hirekiwi/ui';
import { api } from '../../lib/api';
import {
  requestProctoringMedia,
  sampleEnvironment,
  stopProctoringMedia,
} from '../../lib/proctoring/media';
import { enterAssessmentFullscreen } from '../../lib/proctoring/fullscreen';
import type { FaceCheckResult } from '../../lib/proctoring/face-check';
import { FaceLiveCheck } from './face-live-check';
import { isGoogleChrome } from '../../lib/proctoring/chromium';
import { uploadProctoringSnapshot } from '../../lib/proctoring/proctoring-snapshot-upload';
import { skillVerifyRuleItems } from '../../lib/proctoring/skill-verify-rules';
import { ViviLogo } from '../vivi-verification/ViviLogo';

export function OnboardingGate({
  attemptId,
  onPassed,
  fullscreenRootRef,
  cameraEnabled = true,
  faceLiveCheck = false,
  kioskTitle,
  vivi = false,
}: {
  attemptId: string;
  onPassed: (stream: MediaStream | null) => void;
  fullscreenRootRef?: RefObject<HTMLElement | null>;
  /** When false, skip webcam capture and preview. Fullscreen lockdown still runs. */
  cameraEnabled?: boolean;
  /** Live one-face + lighting check after the camera opens. */
  faceLiveCheck?: boolean;
  /** Skill-verify: catalog skill · proficiency in the kiosk header. */
  kioskTitle?: string;
  /** Show the setup steps in the Vivi popup look (used for the project interview). */
  vivi?: boolean;
}) {
  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [message, setMessage] = useState(
    cameraEnabled
      ? faceLiveCheck
        ? 'Allow the camera, then we will check that only one clearly lit face is visible in the oval.'
        : 'Check all three boxes, then continue. The browser will ask for camera and microphone after consent is saved.'
      : 'Continue to enter fullscreen lockdown. Camera is not used for this attempt.',
  );
  const [busy, setBusy] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(!faceLiveCheck);
  const [rulesAck, setRulesAck] = useState(false);
  const [faceEpoch, setFaceEpoch] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const handedOffRef = useRef(false);

  useEffect(() => {
    return () => {
      if (!handedOffRef.current) {
        stopProctoringMedia(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  const finish = useCallback(
    async (stream: MediaStream | null) => {
      await enterAssessmentFullscreen(fullscreenRootRef?.current);
      handedOffRef.current = true;
      onPassed(stream);
    },
    [fullscreenRootRef, onPassed],
  );

  const onFacePassed = useCallback(
    async (sample: FaceCheckResult) => {
      if (!streamRef.current) return;
      if (!sample.ok || !sample.oneFace || sample.faceCount !== 1) {
        setMessage('Only one clearly lit face can continue.');
        setFaceEpoch((n) => n + 1);
        return;
      }
      setBusy(true);
      try {
        const precheck = await api.proctoring.precheck({
          attemptId,
          brightness: sample.brightness,
          audioRmsPercent: 8,
          faceCentered: sample.oneFace,
        });
        if (!precheck.passed) {
          setMessage(precheck.message);
          setFaceEpoch((n) => n + 1);
          return;
        }
        const enrollUpload = await uploadProctoringSnapshot(attemptId, streamRef.current);
        const enroll = await api.proctoring.enrollFace({
          attemptId,
          objectKey: enrollUpload.ok ? enrollUpload.objectKey : undefined,
        });
        if (!enroll.enrolled) {
          setMessage(enroll.message);
          setFaceEpoch((n) => n + 1);
          return;
        }
        const liveness = await api.proctoring.liveness({
          attemptId,
          challenge: 'BLINK',
          yawDelta: 0.1,
          earDelta: 0.05,
        });
        if (!liveness.isLive) {
          setMessage(liveness.message);
          setFaceEpoch((n) => n + 1);
          return;
        }
        await finish(streamRef.current);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Face check failed.');
      } finally {
        setBusy(false);
      }
    },
    [attemptId, finish],
  );

  const chromeOk = !faceLiveCheck || isGoogleChrome();

  async function run() {
    if (!chromeOk) return;
    setBusy(true);
    try {
      if (!cameraEnabled) {
        await finish(null);
        return;
      }
      await api.proctoring.consent({
        attemptId,
        camera: true,
        microphone: true,
        biometricProcessing: true,
      });
      if (!streamRef.current) {
        streamRef.current = await requestProctoringMedia();
      }
      if (faceLiveCheck) {
        setLiveStream(streamRef.current);
        setMessage('Stay in the oval until both checks pass.');
        return;
      }
      const sample = await sampleEnvironment(streamRef.current);
      const precheck = await api.proctoring.precheck({
        attemptId,
        brightness: sample.brightness,
        audioRmsPercent: sample.audioRmsPercent,
        faceCentered: sample.faceCentered,
      });
      if (!precheck.passed) {
        setMessage(precheck.message);
        return;
      }
      const enrollUpload = await uploadProctoringSnapshot(attemptId, streamRef.current);
      const enroll = await api.proctoring.enrollFace({
        attemptId,
        objectKey: enrollUpload.ok ? enrollUpload.objectKey : undefined,
      });
      if (!enroll.enrolled) {
        setMessage(enroll.message);
        return;
      }
      const liveness = await api.proctoring.liveness({
        attemptId,
        challenge: 'BLINK',
        yawDelta: 0.1,
        earDelta: 0.05,
      });
      if (!liveness.isLive) {
        setMessage(liveness.message);
        return;
      }
      if (!streamRef.current) {
        throw new Error('Camera stream missing after onboarding.');
      }
      await finish(streamRef.current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Onboarding failed.');
    } finally {
      setBusy(false);
    }
  }

  const showRules = faceLiveCheck && chromeOk && !rulesAccepted && !liveStream;
  const consentsReady = faceLiveCheck ? camera : camera && microphone && biometric;
  const ready = cameraEnabled ? consentsReady && chromeOk : true;
  const title = !chromeOk
    ? 'Use Google Chrome'
    : showRules
      ? 'How the challenge works'
      : faceLiveCheck
        ? 'Face check'
        : 'Proctoring consent';
  const detail = !chromeOk
    ? 'Skill verification camera checks only work in Google Chrome on a computer. Other browsers cannot continue.'
    : showRules
      ? 'Read this playbook before camera consent. It matches what this challenge actually enforces.'
      : cameraEnabled
        ? faceLiveCheck
          ? 'The camera is used only for this attempt. Align your face with the oval. We scan only that cutout for one well-lit face. Nothing is uploaded from this preview.'
          : 'Camera and microphone are used only for this attempt. Nothing is pre-checked. Device permission is requested only after you continue.'
        : 'This attempt uses fullscreen lockdown and integrity sensors. Camera and microphone are not used.';

  const projectTitle = kioskTitle ? kioskTitle.replace(/^Project defense\s*[—-]\s*/u, '') : null;
  const stepIndex = liveStream ? 2 : rulesAccepted ? 1 : 0;
  const textClass = vivi ? 'text-zinc-600' : 'text-[var(--text-secondary)]';
  const buttonClass = vivi
    ? 'mt-5 h-11 w-full rounded-lg bg-pink-500 font-semibold text-white hover:bg-pink-600 disabled:bg-zinc-200 disabled:text-zinc-400'
    : 'mt-4 w-full bg-teal text-ink hover:bg-teal/90';

  const body = (
    <>
      {showRules ? (
        <div className="mb-4">
          {vivi ? (
            <ol className="mb-5 space-y-3">
              {skillVerifyRuleItems().map((rule, index) => (
                <li key={rule} className="flex gap-3 text-[13.5px] leading-relaxed text-zinc-700">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-50 text-[11px] font-semibold text-pink-600 ring-1 ring-pink-100"
                  >
                    {index + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ol className={`mb-4 list-decimal space-y-2 pl-5 text-sm ${textClass}`}>
              {skillVerifyRuleItems().map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          )}
          <ConsentRow
            id="proctor-rules-ack"
            checked={rulesAck}
            onChange={setRulesAck}
            label="I have read this playbook and I will follow it"
            light={vivi}
          />
        </div>
      ) : null}
      {chromeOk && cameraEnabled && !liveStream && !showRules ? (
        <div className="mb-4 space-y-2">
          <ConsentRow
            id="proctor-consent-camera"
            checked={camera}
            onChange={setCamera}
            label="I agree to camera use"
            light={vivi}
          />
          {faceLiveCheck ? null : (
            <>
              <ConsentRow
                id="proctor-consent-mic"
                checked={microphone}
                onChange={setMicrophone}
                label="I agree to microphone use"
                light={vivi}
              />
              <ConsentRow
                id="proctor-consent-biometric"
                checked={biometric}
                onChange={setBiometric}
                label="I agree to biometric processing for identity checks"
                light={vivi}
              />
            </>
          )}
        </div>
      ) : null}
      {liveStream ? (
        <div>
          <FaceLiveCheck
            key={faceEpoch}
            stream={liveStream}
            onPassed={onFacePassed}
            busy={busy}
            vivi={vivi}
          />
        </div>
      ) : null}
      <p className={`text-sm ${textClass}`} role={!chromeOk ? 'alert' : undefined}>
        {!chromeOk
          ? 'Open this page in Google Chrome on a computer, then start verification again.'
          : showRules
            ? null
            : message}
      </p>
    </>
  );

  const action =
    liveStream || !chromeOk ? null : showRules ? (
      <Button
        type="button"
        disabled={!rulesAck}
        className={buttonClass}
        onClick={() => setRulesAccepted(true)}
      >
        Continue to camera consent
      </Button>
    ) : (
      <Button
        type="button"
        disabled={!ready || busy}
        className={buttonClass}
        onClick={() => void run()}
      >
        {busy ? 'Checking…' : cameraEnabled ? 'Continue and allow camera' : 'Continue'}
      </Button>
    );

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-[var(--background)] text-[var(--text-primary)] ${vivi ? 'font-sans' : ''}`}
    >
      {vivi ? (
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-pink-100 bg-white px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white">
              <ShieldCheck className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading truncate text-base leading-tight font-semibold tracking-tight">
                Project Verification
              </h1>
              <p className="truncate text-xs text-[var(--text-muted)]">{projectTitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="hidden flex-col items-end gap-1.5 sm:flex">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                {faceLiveCheck
                  ? liveStream
                    ? 'Step 3 of 3 · Stay in frame'
                    : rulesAccepted
                      ? 'Step 2 of 3 · Consent'
                      : 'Step 1 of 3 · Playbook'
                  : 'Before you begin'}
              </p>
              <div className="flex w-40 gap-1" aria-hidden>
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 rounded-full ${index <= stepIndex ? 'bg-pink-500' : 'bg-pink-200'}`}
                  />
                ))}
              </div>
            </div>
            <span className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              Powered by
              <ViviLogo className="h-5" />
            </span>
          </div>
        </header>
      ) : (
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface)] px-6 py-3">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {kioskTitle ?? (faceLiveCheck ? 'Skill verification' : 'Assessment')}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {faceLiveCheck
              ? liveStream
                ? 'Step 3 of 3 · Stay in frame'
                : rulesAccepted
                  ? 'Step 2 of 3 · Consent'
                  : 'Step 1 of 3 · Playbook'
              : 'Before you begin'}
          </p>
        </header>
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        <Card
          className={`w-full ${vivi ? 'border-pink-100 bg-white shadow-sm' : 'border-white/10 bg-[var(--surface)]'} ${liveStream ? 'max-w-xl' : 'max-w-lg'}`}
        >
          <CardHeader className={liveStream ? 'mb-4' : 'mb-5'}>
            <div
              className={`mb-3 flex size-11 items-center justify-center rounded-full ${vivi ? 'bg-pink-50 text-pink-500' : 'bg-teal-500/15 text-teal-300'}`}
            >
              {showRules ? (
                <ClipboardList className="size-5" aria-hidden />
              ) : (
                <Camera className="size-5" aria-hidden />
              )}
            </div>
            <CardTitle
              className={vivi ? 'font-heading text-xl font-semibold tracking-tight' : undefined}
            >
              {title}
            </CardTitle>
            <CardDescription>{detail}</CardDescription>
          </CardHeader>
          {body}
          {action}
        </Card>
      </div>
    </div>
  );
}

function ConsentRow({
  id,
  checked,
  onChange,
  label,
  light = false,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  light?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm ${
        light
          ? 'border-pink-100 bg-pink-50/50 text-zinc-800 transition-colors hover:bg-pink-50'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={`mt-0.5 size-4 shrink-0 ${light ? 'accent-pink-500' : 'accent-teal-400'}`}
      />
      <span>{label}</span>
    </label>
  );
}
