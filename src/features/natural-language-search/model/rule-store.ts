'use client';

import { create } from 'zustand';
import type { NaturalLanguageSearchRule } from './types';

interface RuleState {
  appliedRule: NaturalLanguageSearchRule | null;
  revision: number;
  applyRule: (rule: NaturalLanguageSearchRule) => void;
  clearRule: () => void;
}

export const useNaturalLanguageRuleStore = create<RuleState>(set => ({
  appliedRule: null,
  revision: 0,
  applyRule: rule =>
    set(state => ({
      appliedRule: rule,
      revision: state.revision + 1,
    })),
  clearRule: () =>
    set(state => ({
      appliedRule: null,
      revision: state.revision + 1,
    })),
}));
