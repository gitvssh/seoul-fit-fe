'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Info, MapPinned } from 'lucide-react';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { SidebarSection } from './SidebarSection';

export const GITHUB_REPO_URL = 'https://github.com/gitvssh/seoul-fit-fe';

const ROW_CLASS =
  'flex min-h-11 items-center gap-3 px-4 text-body text-foreground outline-none transition-colors duration-fast hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset';

interface LinksSectionProps {
  onNavigate?: (href: string) => void;
}

export function LinksSection({ onNavigate }: LinksSectionProps) {
  const { t } = useI18n();

  return (
    <SidebarSection id='sidebar-explore' title={t('sidebar.explore')} className='border-b-0'>
      <Link href='/places' className={ROW_CLASS} onClick={() => onNavigate?.('/places')}>
        <MapPinned className='size-5 shrink-0 text-muted-foreground' aria-hidden='true' />
        <span className='flex-1'>{t('header.places')}</span>
      </Link>
      <Link href='/about' className={ROW_CLASS} onClick={() => onNavigate?.('/about')}>
        <Info className='size-5 shrink-0 text-muted-foreground' aria-hidden='true' />
        <span className='flex-1'>{t('sidebar.about')}</span>
      </Link>
      <a href={GITHUB_REPO_URL} target='_blank' rel='noopener noreferrer' className={ROW_CLASS}>
        <ExternalLink className='size-5 shrink-0 text-muted-foreground' aria-hidden='true' />
        <span className='flex-1'>{t('sidebar.github')}</span>
        <span className='sr-only'>{t('common.opensInNewTab')}</span>
      </a>
    </SidebarSection>
  );
}
