import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { NoteCard, ErrorDisplay, Title } from '@/components'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'

function Settings() {
  return (
    <div className="journal-paper h-full min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
      <Title
        title="Settings"
        description="Manage your account settings - TBA"
      />
    </div>
  )
}

export default Settings
