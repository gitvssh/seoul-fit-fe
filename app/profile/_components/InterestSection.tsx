'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { getUserInterests, updateUserInterests } from '@/shared/api/preference';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { toast } from '@/shared/lib/utils/toast';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { GENERAL_OPTIONS, REALTIME_OPTIONS, type InterestOption } from './interest-categories';

interface OptionGroupProps {
  title: string;
  options: readonly InterestOption[];
  selected: string[];
  editing: boolean;
  onToggle: (key: string) => void;
}

function OptionGroup({ title, options, selected, editing, onToggle }: Readonly<OptionGroupProps>) {
  const { t } = useI18n();
  return (
    <fieldset className='min-w-0'>
      <legend className='text-label text-muted-foreground'>{title}</legend>
      <ul className='mt-3 grid gap-2 sm:grid-cols-2'>
        {options.map(option => {
          const checked = selected.includes(option.key);
          return (
            <li key={option.key}>
              <label
                aria-label={t(option.labelKey)}
                className={cn(
                  'flex min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-lg border p-3 transition-[border-color,background-color] duration-fast ease-standard has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                  checked ? 'border-primary bg-accent' : 'border-border bg-card',
                  !editing && 'cursor-default'
                )}
              >
                <input
                  type='checkbox'
                  className='sr-only'
                  checked={checked}
                  disabled={!editing}
                  onChange={() => onToggle(option.key)}
                />
                <span
                  aria-hidden='true'
                  className={cn(
                    'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
                    option.color,
                    option.glyphColor
                  )}
                >
                  <option.Icon className='size-4' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='flex items-center gap-2 text-body-sm font-medium text-foreground'>
                    {t(option.labelKey)}
                    {checked && <Check aria-hidden='true' className='size-4 text-primary' />}
                  </span>
                  <span className='mt-0.5 block text-caption text-muted-foreground'>
                    {t(option.descriptionKey)}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export interface InterestSectionProps {
  /** Interests persisted with the account, used as the fallback when the API is empty. */
  fallbackInterests: string[];
  onChange?: (interests: string[]) => void;
}

/** Loads, edits and saves the account's interest categories. */
export function InterestSection({ fallbackInterests, onChange }: Readonly<InterestSectionProps>) {
  const { t } = useI18n();
  const [saved, setSaved] = useState<string[]>(fallbackInterests);
  const [draft, setDraft] = useState<string[]>(fallbackInterests);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUserInterests()
      .then(response => {
        if (cancelled) return;
        const interests =
          response.interests.length > 0
            ? response.interests.map(interest => interest.category)
            : fallbackInterests;
        setSaved(interests);
        setDraft(interests);
        onChange?.(interests);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // The fallback only seeds the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: string) => {
    setDraft(current =>
      current.includes(key) ? current.filter(item => item !== key) : [...current, key]
    );
  };

  const cancel = () => {
    setDraft(saved);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateUserInterests(draft);
      setSaved(draft);
      onChange?.(draft);
      setEditing(false);
      toast.success(t('profile.interests.saved'));
      trackEvent('preferences_saved', { page_type: 'profile' });
    } catch {
      toast.error(t('profile.interests.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby='interests-heading'
      className='rounded-xl border border-border bg-card p-6 shadow-float-sm'
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 id='interests-heading' className='text-section text-foreground'>
            {t('profile.interests.title')}
          </h2>
          <p className='mt-1 text-body-sm text-muted-foreground'>
            {t('profile.interests.description')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='muted' className='tabular-nums'>
            {t('profile.interests.selected', { count: draft.length })}
          </Badge>
          {editing ? (
            <>
              <Button variant='outline' onClick={cancel} disabled={saving}>
                {t('profile.interests.cancel')}
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 aria-hidden='true' className='animate-spin' />
                ) : (
                  <Check aria-hidden='true' />
                )}
                {saving ? t('profile.interests.saving') : t('profile.interests.save')}
              </Button>
            </>
          ) : (
            <Button variant='outline' onClick={() => setEditing(true)} disabled={loading}>
              <Pencil aria-hidden='true' />
              {t('profile.interests.edit')}
            </Button>
          )}
        </div>
      </div>

      {loadFailed && (
        <Alert variant='warning' className='mt-4'>
          <AlertDescription>{t('profile.interests.loadFailed')}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className='mt-6 grid gap-2 sm:grid-cols-2' aria-busy='true'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className='h-[4.5rem] rounded-lg' />
          ))}
        </div>
      ) : (
        <div className='mt-6 space-y-6'>
          <OptionGroup
            title={t('profile.interests.realtime')}
            options={REALTIME_OPTIONS}
            selected={draft}
            editing={editing}
            onToggle={toggle}
          />
          <OptionGroup
            title={t('profile.interests.general')}
            options={GENERAL_OPTIONS}
            selected={draft}
            editing={editing}
            onToggle={toggle}
          />
        </div>
      )}
    </section>
  );
}
