import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";
import {
  copy,
  demoInput,
  detectInputLanguage,
  downloadFinalReport,
  emptyLinkedResponses,
  getCombinedText,
  initialDraft,
  STORAGE_KEY,
  type InputMode,
  type RebuttalMode,
} from "@/lib/reject-me-first";
import {
  defaultStructuredInput,
  defaultStructuredRebuttal,
  type AgentKey,
  type FirstReview,
  type Language,
  type ReevaluateInput,
  type ReevaluateResult,
  type RebuttalInput,
  type StructuredFounderInput,
} from "@shared/rejectMeFirst";

type StructuredRebuttalDraft = Record<AgentKey, { objection: string; response: string }[]>;

const rebuttalAgents = Object.keys(defaultStructuredRebuttal) as AgentKey[];

function createStructuredRebuttalDraft(
  source?: Partial<Record<AgentKey, unknown>> | null,
): StructuredRebuttalDraft {
  return Object.fromEntries(
    rebuttalAgents.map(agent => [
      agent,
      Array.isArray(source?.[agent]) ? (source?.[agent] as { objection: string; response: string }[]) : [],
    ]),
  ) as StructuredRebuttalDraft;
}

type DraftState = {
  inputMode: InputMode;
  rebuttalMode: RebuttalMode;
  preferredLanguage: Language;
  useMock: boolean;
  freeText: string;
  transcriptText: string;
  structured: StructuredFounderInput;
  structuredRebuttal: StructuredRebuttalDraft;
  freeRebuttal: string;
  firstRound: FirstReview | null;
  rebuttalResult: ReevaluateResult | null;
};

type CommitteeFlowContextValue = DraftState & {
  direction: "ltr" | "rtl";
  text: (typeof copy)[Language];
  hasFirstRound: boolean;
  hasVerdict: boolean;
  reviewPending: boolean;
  rebuttalPending: boolean;
  reviewError: string | null;
  rebuttalError: string | null;
  setInputMode: (mode: InputMode) => void;
  setRebuttalMode: (mode: RebuttalMode) => void;
  setPreferredLanguage: (language: Language) => void;
  setUseMock: (value: boolean) => void;
  setFreeText: (value: string) => void;
  setTranscriptText: (value: string) => void;
  updateStructured: (field: keyof StructuredFounderInput, value: string) => void;
  addSection: () => void;
  updateSection: (index: number, field: "title" | "content", value: string) => void;
  removeSection: (index: number) => void;
  setFreeRebuttal: (value: string) => void;
  setStructuredRebuttal: (agent: AgentKey, index: number, field: "objection" | "response", value: string) => void;
  addStructuredRebuttalRow: (agent: AgentKey, objection?: string) => void;
  removeStructuredRebuttalRow: (agent: AgentKey, index: number) => void;
  startCommittee: () => Promise<FirstReview>;
  submitCommitteeRebuttal: () => Promise<ReevaluateResult>;
  loadDemo: () => Promise<void>;
  resetAll: () => void;
  downloadReport: () => void;
  buildReevaluationInput: () => ReevaluateInput | null;
  linkedResponseMap: Record<AgentKey, { objection: string; response: string }[]>;
};

const CommitteeFlowContext = createContext<CommitteeFlowContextValue | null>(null);

function normalizeLanguage(input: string, fallback: Language): Language {
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  return detectInputLanguage(trimmed);
}

export function restoreDraftState(parsed?: Partial<DraftState> | null): DraftState {
  const draft = initialDraft();

  if (!parsed) return draft;

  return {
    ...draft,
    ...parsed,
    structured: {
      ...defaultStructuredInput,
      ...(parsed.structured ?? {}),
      projectName: sanitizeStructuredFieldValue("projectName", parsed.structured?.projectName ?? ""),
      idea: sanitizeStructuredFieldValue("idea", parsed.structured?.idea ?? defaultStructuredInput.idea),
      problem: sanitizeStructuredFieldValue("problem", parsed.structured?.problem ?? defaultStructuredInput.problem),
      solution: sanitizeStructuredFieldValue("solution", parsed.structured?.solution ?? defaultStructuredInput.solution),
      additionalInfo: sanitizeStructuredFieldValue("additionalInfo", parsed.structured?.additionalInfo ?? defaultStructuredInput.additionalInfo),
      sections: Array.isArray(parsed.structured?.sections) ? parsed.structured.sections : [],
    },
    structuredRebuttal: createStructuredRebuttalDraft(parsed.structuredRebuttal as Partial<Record<AgentKey, unknown>> | null),
  };
}

function getPersistedDraft(): DraftState {
  if (typeof window === "undefined") return initialDraft();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDraft();

    const parsed = JSON.parse(raw) as Partial<DraftState>;
    return restoreDraftState(parsed);
  } catch {
    return initialDraft();
  }
}

export function buildFreshDraft(preferredLanguage: Language): DraftState {
  return {
    ...initialDraft(),
    preferredLanguage,
  };
}

const STRUCTURED_FIELD_LIMITS: Partial<Record<keyof StructuredFounderInput, number>> = {
  projectName: 120,
  idea: 2400,
  problem: 2400,
  solution: 2400,
  additionalInfo: 2400,
};

export function sanitizeStructuredFieldValue(field: keyof StructuredFounderInput, value: string): string {
  const limit = STRUCTURED_FIELD_LIMITS[field];
  if (!limit) return value;
  return value.slice(0, limit);
}

function toMessage(error: unknown, fallback: string, language: Language = "en") {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      if (message.includes('"path":["project_name"]') && message.includes('"maximum":120')) {
        return language === "ar"
          ? "اسم المشروع طويل جدًا. اختصره إلى 120 حرفًا أو أقل."
          : "Project name is too long. Keep it within 120 characters.";
      }
      return message;
    }
  }
  return fallback;
}

export function CommitteeFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DraftState>(() => getPersistedDraft());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [rebuttalError, setRebuttalError] = useState<string | null>(null);

  const committeeStart = trpc.committee.startReview.useMutation();
  const committeeRebuttal = trpc.committee.submitRebuttal.useMutation();
  const demoQuery = trpc.committee.demo.useQuery(draft.preferredLanguage, { enabled: false });

  const direction = draft.preferredLanguage === "ar" ? "rtl" : "ltr";
  const text = copy[draft.preferredLanguage];

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = draft.preferredLanguage;
    document.documentElement.dir = direction;
  }, [direction, draft.preferredLanguage]);

  const setInputMode = useCallback((mode: InputMode) => {
    setDraft(current => ({ ...current, inputMode: mode }));
  }, []);

  const setRebuttalMode = useCallback((mode: RebuttalMode) => {
    setDraft(current => ({ ...current, rebuttalMode: mode }));
  }, []);

  const setPreferredLanguage = useCallback((language: Language) => {
    setDraft(current => ({ ...current, preferredLanguage: language }));
  }, []);

  const setUseMock = useCallback((value: boolean) => {
    setDraft(current => ({ ...current, useMock: value }));
  }, []);

  const setFreeText = useCallback((value: string) => {
    setDraft(current => ({ ...current, freeText: value }));
  }, []);

  const setTranscriptText = useCallback((value: string) => {
    setDraft(current => ({ ...current, transcriptText: value }));
  }, []);

  const updateStructured = useCallback((field: keyof StructuredFounderInput, value: string) => {
    setDraft(current => ({
      ...current,
      structured: {
        ...current.structured,
        [field]: sanitizeStructuredFieldValue(field, value),
      },
    }));
  }, []);

  const addSection = useCallback(() => {
    setDraft(current => ({
      ...current,
      structured: {
        ...current.structured,
        sections: [...current.structured.sections, { title: "", content: "" }],
      },
    }));
  }, []);

  const updateSection = useCallback((index: number, field: "title" | "content", value: string) => {
    setDraft(current => ({
      ...current,
      structured: {
        ...current.structured,
        sections: current.structured.sections.map((section, sectionIndex) =>
          sectionIndex === index ? { ...section, [field]: value } : section,
        ),
      },
    }));
  }, []);

  const removeSection = useCallback((index: number) => {
    setDraft(current => ({
      ...current,
      structured: {
        ...current.structured,
        sections: current.structured.sections.filter((_, sectionIndex) => sectionIndex !== index),
      },
    }));
  }, []);

  const setFreeRebuttal = useCallback((value: string) => {
    setDraft(current => ({ ...current, freeRebuttal: value }));
  }, []);

  const setStructuredRebuttal = useCallback(
    (agent: AgentKey, index: number, field: "objection" | "response", value: string) => {
      setDraft(current => ({
        ...current,
        structuredRebuttal: {
          ...current.structuredRebuttal,
          [agent]: current.structuredRebuttal[agent].map((item: { objection: string; response: string }, itemIndex) =>
            itemIndex === index ? { objection: item.objection, response: item.response, [field]: value } : item,
          ),
        },
      }));
    },
    [],
  );

  const addStructuredRebuttalRow = useCallback((agent: AgentKey, objection = "") => {
    setDraft(current => ({
      ...current,
      structuredRebuttal: {
        ...current.structuredRebuttal,
        [agent]: [...current.structuredRebuttal[agent], { objection, response: "" }],
      },
    }));
  }, []);

  const removeStructuredRebuttalRow = useCallback((agent: AgentKey, index: number) => {
    setDraft(current => ({
      ...current,
      structuredRebuttal: {
        ...current.structuredRebuttal,
        [agent]: current.structuredRebuttal[agent].filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }, []);

  const buildStartInput = useCallback(() => {
    const combinedText = getCombinedText(draft.freeText, draft.structured, draft.transcriptText);

    return {
      language: normalizeLanguage(combinedText, draft.preferredLanguage),
      freeText: draft.inputMode === "free" ? draft.freeText : "",
      structured: draft.structured,
      transcriptText: draft.transcriptText,
      extraFragments: [],
      useMock: draft.useMock,
    };
  }, [draft]);

  const buildReevaluationInput = useCallback((): ReevaluateInput | null => {
    if (!draft.firstRound) return null;

    const rebuttal: RebuttalInput = {
      freeText: draft.rebuttalMode === "free" ? draft.freeRebuttal : "",
      structured: draft.rebuttalMode === "structured" ? draft.structuredRebuttal : defaultStructuredRebuttal,
    };

    return {
      language: draft.firstRound.language,
      direction: draft.firstRound.direction,
      mode: draft.firstRound.mode,
      projectBrief: draft.firstRound.projectBrief,
      reviews: draft.firstRound.reviews,
      rebuttal,
    };
  }, [draft.firstRound, draft.freeRebuttal, draft.rebuttalMode, draft.structuredRebuttal]);

  const startCommittee = useCallback(async () => {
    setReviewError(null);

    try {
      const result = await committeeStart.mutateAsync(buildStartInput());
      setDraft(current => ({
        ...current,
        preferredLanguage: result.language,
        firstRound: result,
        rebuttalResult: null,
      }));
      return result;
    } catch (error) {
      const message = toMessage(error, "Failed to run committee review.", draft.preferredLanguage);
      setReviewError(message);
      throw error;
    }
  }, [buildStartInput, committeeStart]);

  const submitCommitteeRebuttal = useCallback(async () => {
    const input = buildReevaluationInput();
    if (!input) {
      throw new Error("First review is required before rebuttal.");
    }

    setRebuttalError(null);

    try {
      const result = await committeeRebuttal.mutateAsync(input);
      setDraft(current => ({
        ...current,
        rebuttalResult: result,
      }));
      return result;
    } catch (error) {
      const message = toMessage(error, "Failed to submit rebuttal.");
      setRebuttalError(message);
      throw error;
    }
  }, [buildReevaluationInput, committeeRebuttal]);

  const loadDemo = useCallback(async () => {
    const result = await demoQuery.refetch();
    if (!result.data) return;

    setDraft(current => ({
      ...current,
      preferredLanguage: current.preferredLanguage,
      inputMode: "structured",
      rebuttalMode: "structured",
      useMock: true,
      freeText: "",
      transcriptText: "",
      structured: result.data.input.structured ?? demoInput(),
      structuredRebuttal: (() => {
        const structured =
          result.data.rebuttal && "structured" in result.data.rebuttal
            ? result.data.rebuttal.structured
            : undefined;
        return createStructuredRebuttalDraft(structured as Partial<Record<AgentKey, unknown>> | null);
      })(),
      freeRebuttal: result.data.rebuttal.freeText ?? "",
      firstRound: result.data.first_round,
      rebuttalResult: result.data.second_round,
    }));
  }, [demoQuery]);

  const resetAll = useCallback(() => {
    setDraft(buildFreshDraft(draft.preferredLanguage));
    setReviewError(null);
    setRebuttalError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [draft.preferredLanguage]);

  const downloadReport = useCallback(() => {
    if (!draft.firstRound || !draft.rebuttalResult) return;
    downloadFinalReport({
      language: draft.rebuttalResult.language,
      firstRound: draft.firstRound,
      rebuttalResult: draft.rebuttalResult,
    });
  }, [draft.firstRound, draft.rebuttalResult]);

  const linkedResponseMap = useMemo(() => {
    const grouped = emptyLinkedResponses();

    for (const item of draft.rebuttalResult?.linked_rebuttal ?? []) {
      grouped[item.agent].push({
        objection: item.objection,
        response: item.response,
      });
    }

    return grouped;
  }, [draft.rebuttalResult]);

  const value: CommitteeFlowContextValue = {
    ...draft,
    direction,
    text,
    hasFirstRound: Boolean(draft.firstRound),
    hasVerdict: Boolean(draft.rebuttalResult),
    reviewPending: committeeStart.isPending,
    rebuttalPending: committeeRebuttal.isPending,
    reviewError,
    rebuttalError,
    setInputMode,
    setRebuttalMode,
    setPreferredLanguage,
    setUseMock,
    setFreeText,
    setTranscriptText,
    updateStructured,
    addSection,
    updateSection,
    removeSection,
    setFreeRebuttal,
    setStructuredRebuttal,
    addStructuredRebuttalRow,
    removeStructuredRebuttalRow,
    startCommittee,
    submitCommitteeRebuttal,
    loadDemo,
    resetAll,
    downloadReport,
    buildReevaluationInput,
    linkedResponseMap,
  };

  return <CommitteeFlowContext.Provider value={value}>{children}</CommitteeFlowContext.Provider>;
}

export function useCommitteeFlow() {
  const context = useContext(CommitteeFlowContext);
  if (!context) {
    throw new Error("useCommitteeFlow must be used within CommitteeFlowProvider");
  }
  return context;
}
